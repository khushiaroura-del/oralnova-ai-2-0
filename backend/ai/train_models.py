
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import (
    mobilenet_v3_small,
    MobileNet_V3_Small_Weights,
)

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from backend.ai.config.training_config import (
    PROJECT_DIR,
    MODEL_DIR,
    RANDOM_SEED,
    PRETRAINED,
    NORMALIZATION,
    TRAINING,
    CLINICAL_CONFIG,
    HISTOPATHOLOGY_CONFIG,
)


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


class OralImageDataset(Dataset):
    def __init__(self, dataframe, transform):
        self.dataframe = dataframe.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.dataframe)

    def __getitem__(self, index):
        row = self.dataframe.iloc[index]

        image_path = PROJECT_DIR / row["processed_path"]

        with Image.open(image_path) as image:
            image = image.convert("RGB")
            image = image.copy()

        image = self.transform(image)
        label = int(row["class_index"])

        return image, label


def get_transforms(config, training=False):
    operations = []

    if training:
        aug = config["augmentation"]

        operations.extend([
            transforms.RandomRotation(
                aug["rotation_degrees"],
                fill=(255, 255, 255),
            ),
            transforms.RandomHorizontalFlip(
                p=aug["horizontal_flip_probability"]
            ),
            transforms.ColorJitter(
                brightness=aug["brightness"],
                contrast=aug["contrast"],
            ),
        ])

    operations.extend([
        transforms.ToTensor(),
        transforms.Normalize(
            mean=NORMALIZATION["mean"],
            std=NORMALIZATION["std"],
        ),
    ])

    return transforms.Compose(operations)


def build_model(num_classes):
    weights = (
        MobileNet_V3_Small_Weights.DEFAULT
        if PRETRAINED else None
    )

    model = mobilenet_v3_small(weights=weights)

    input_features = model.classifier[3].in_features

    model.classifier[3] = nn.Linear(
        input_features,
        num_classes,
    )

    return model


def calculate_loss(model, loader, criterion, device):
    model.eval()

    total_loss = 0.0
    total_images = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            total_loss += loss.item() * images.size(0)
            total_images += images.size(0)

    return total_loss / total_images


def evaluate_model(model, loader, device, config):
    model.eval()

    actual = []
    predicted = []

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)

            outputs = model(images)
            predictions = outputs.argmax(dim=1)

            actual.extend(labels.tolist())
            predicted.extend(predictions.cpu().tolist())

    class_names = list(config["class_mapping"].keys())
    class_indices = list(config["class_mapping"].values())

    report = classification_report(
        actual,
        predicted,
        labels=class_indices,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    matrix = confusion_matrix(
        actual,
        predicted,
        labels=class_indices,
    )

    results = {
        "accuracy": accuracy_score(actual, predicted),
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }

    if config["name"] == "clinical":
        # Class 0 = cancer, class 1 = non-cancer.
        tn, fp, fn, tp = matrix.ravel()

        results["cancer_sensitivity"] = (
            tp * 0 + (matrix[0, 0] / (matrix[0, 0] + matrix[0, 1]))
            if matrix[0].sum() > 0 else 0.0
        )

        results["non_cancer_specificity"] = (
            matrix[1, 1] / matrix[1].sum()
            if matrix[1].sum() > 0 else 0.0
        )

    return results


def train_one_model(config):
    name = config["name"]

    print("\n" + "=" * 60)
    print(f"TRAINING MODEL: {name.upper()}")
    print("=" * 60)

    dataframe = pd.read_csv(config["manifest"])

    train_df = dataframe[dataframe["split"] == "train"]
    val_df = dataframe[dataframe["split"] == "validation"]
    test_df = dataframe[dataframe["split"] == "test"]

    if min(len(train_df), len(val_df), len(test_df)) == 0:
        raise ValueError(f"{name}: A data split is empty.")

    for _, row in dataframe.iterrows():
        expected_index = config["class_mapping"].get(row["label"])

        if expected_index is None or int(row["class_index"]) != expected_index:
            raise ValueError(
                f"{name}: Label mapping mismatch for {row['label']}"
            )

    device = torch.device(TRAINING["device"])

    train_dataset = OralImageDataset(
        train_df,
        get_transforms(config, training=True),
    )

    val_dataset = OralImageDataset(
        val_df,
        get_transforms(config),
    )

    test_dataset = OralImageDataset(
        test_df,
        get_transforms(config),
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=TRAINING["batch_size"],
        shuffle=True,
        num_workers=TRAINING["num_workers"],
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=TRAINING["batch_size"],
        shuffle=False,
        num_workers=TRAINING["num_workers"],
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=TRAINING["batch_size"],
        shuffle=False,
        num_workers=TRAINING["num_workers"],
    )

    model = build_model(config["num_classes"]).to(device)

    class_weights = torch.tensor(
        config["class_weights"],
        dtype=torch.float32,
        device=device,
    )

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=TRAINING["learning_rate"],
        weight_decay=TRAINING["weight_decay"],
    )

    best_val_loss = float("inf")
    patience_counter = 0
    best_epoch = 0

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    checkpoint_path = config["output_weights"]

    for epoch in range(TRAINING["epochs"]):
        model.train()

        running_loss = 0.0
        total_images = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            total_images += images.size(0)

        train_loss = running_loss / total_images

        val_loss = calculate_loss(
            model,
            val_loader,
            criterion,
            device,
        )

        print(
            f"Epoch {epoch + 1:02d}/{TRAINING['epochs']} "
            f"| Train Loss: {train_loss:.4f} "
            f"| Validation Loss: {val_loss:.4f}"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_epoch = epoch + 1
            patience_counter = 0

            torch.save(model.state_dict(), checkpoint_path)

        else:
            patience_counter += 1

        if patience_counter >= TRAINING["early_stopping_patience"]:
            print("Early stopping activated.")
            break

    if not checkpoint_path.exists():
        raise RuntimeError(f"{name}: No model checkpoint was saved.")

    model.load_state_dict(
        torch.load(checkpoint_path, map_location=device)
    )

    print("\nBEST EPOCH:", best_epoch)
    print("BEST VALIDATION LOSS:", round(best_val_loss, 4))
    print("CHECKPOINT:", checkpoint_path)

    # Test set is evaluated only after selecting the best checkpoint.
    results = evaluate_model(
        model,
        test_loader,
        device,
        config,
    )

    print("\nFINAL TEST RESULTS")
    print("Test accuracy:", round(results["accuracy"], 4))
    print("\nClassification report:")

    print(
        classification_report(
            test_df["class_index"],
            predict_labels(model, test_loader, device),
            labels=list(config["class_mapping"].values()),
            target_names=list(config["class_mapping"].keys()),
            zero_division=0,
        )
    )

    report_path = (
        PROJECT_DIR / "backend" / "ai" / "outputs"
        / f"{name}_evaluation.json"
    )

    with open(report_path, "w", encoding="utf-8") as file:
        json.dump(results, file, indent=4)

    print("Evaluation report:", report_path)


def predict_labels(model, loader, device):
    model.eval()
    predictions = []

    with torch.no_grad():
        for images, _ in loader:
            outputs = model(images.to(device))
            predictions.extend(outputs.argmax(dim=1).cpu().tolist())

    return predictions


def main():
    set_seed(RANDOM_SEED)

    print("DEVICE:", TRAINING["device"])
    print("PRETRAINED:", PRETRAINED)

    try:
        train_one_model(CLINICAL_CONFIG)
        train_one_model(HISTOPATHOLOGY_CONFIG)

    except Exception as error:
        print("\nTRAINING STOPPED:", str(error))
        raise

    print("\nBOTH MODEL TRAINING JOBS FINISHED.")


if __name__ == "__main__":
    main()
