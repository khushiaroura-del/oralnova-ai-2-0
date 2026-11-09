
from pathlib import Path

import pandas as pd
from sklearn.utils.class_weight import compute_class_weight
import numpy as np

PROJECT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

DATASETS = {
    "clinical": OUTPUT_DIR / "clinical_224_processed.csv",
    "histopathology": OUTPUT_DIR / "histopathology_224_processed.csv",
}


def audit_dataset(name, manifest_path):
    print("\n" + "=" * 55)
    print(f"{name.upper()} CLASS IMBALANCE AUDIT")
    print("=" * 55)

    df = pd.read_csv(manifest_path)

    # Only training data is used to calculate class weights.
    train_df = df[df["split"] == "train"].copy()

    class_counts = train_df["class_index"].value_counts().sort_index()

    classes = np.sort(train_df["class_index"].unique())

    weights = compute_class_weight(
        class_weight="balanced",
        classes=classes,
        y=train_df["class_index"].to_numpy()
    )

    print("\nTRAINING CLASS DISTRIBUTION")

    for class_index, count in class_counts.items():
        label = train_df[
            train_df["class_index"] == class_index
        ]["label"].iloc[0]

        weight = weights[list(classes).index(class_index)]

        print(
            f"Class {class_index} | {label} | "
            f"Images: {count} | Weight: {weight:.4f}"
        )

    print("\nTRAINING IMAGES:", len(train_df))
    print("VALIDATION IMAGES:", len(df[df["split"] == "validation"]))
    print("TEST IMAGES:", len(df[df["split"] == "test"]))

    print("\nCLASS WEIGHTS:", weights.round(4).tolist())


def main():
    for name, manifest in DATASETS.items():
        audit_dataset(name, manifest)

    print("\nCLASS IMBALANCE AUDIT COMPLETED")


if __name__ == "__main__":
    main()
