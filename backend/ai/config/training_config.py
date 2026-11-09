
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[3]
AI_DIR = PROJECT_DIR / "backend" / "ai"
OUTPUT_DIR = AI_DIR / "outputs"
MODEL_DIR = AI_DIR / "models"

RANDOM_SEED = 42

MODEL_NAME = "mobilenet_v3_small"
PRETRAINED = True

NORMALIZATION = {
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
}

TRAINING = {
    "device": "cpu",
    "batch_size": 8,
    "epochs": 30,
    "learning_rate": 0.0001,
    "weight_decay": 0.0001,
    "early_stopping_patience": 7,
    "num_workers": 0,
}

AUGMENTATION = {
    "rotation_degrees": 10,
    "horizontal_flip_probability": 0.5,
    "vertical_flip_probability": 0.0,
    "brightness": 0.10,
    "contrast": 0.10,
}

CLINICAL_CONFIG = {
    "name": "clinical",
    "num_classes": 2,
    "image_size": 224,
    "manifest": OUTPUT_DIR / "clinical_224_processed.csv",
    "output_weights": MODEL_DIR / "clinical_mobilenet_v3_small.pth",
    "class_mapping": {
        "cancer": 0,
        "non-cancer": 1,
    },
    "class_weights": [0.8409, 1.2333],
    "augmentation": {
        **AUGMENTATION,
    },
}

HISTOPATHOLOGY_CONFIG = {
    "name": "histopathology",
    "num_classes": 5,
    "image_size": 224,
    "manifest": OUTPUT_DIR / "histopathology_224_processed.csv",
    "output_weights": MODEL_DIR / "histopathology_mobilenet_v3_small.pth",
    "class_mapping": {
        "Normal": 0,
        "Oral Squamous Cell Carcinoma": 1,
        "Odontogenic Keratocyst": 2,
        "Ameloblastoma (Plexiform)": 3,
        "Pleomorphic Adenoma": 4,
    },
    "class_weights": [0.8320, 0.6029, 1.1556, 2.7733, 1.0947],
    "augmentation": {
        **AUGMENTATION,
        "rotation_degrees": 15,
        "brightness": 0.05,
        "contrast": 0.05,
    },
}

HISTOPATHOLOGY_HIGH_RES_CONFIG = {
    **HISTOPATHOLOGY_CONFIG,
    "image_size": 384,
    "manifest": OUTPUT_DIR / "histopathology_384_processed.csv",
    "output_weights": MODEL_DIR / "histopathology_mobilenet_v3_small_384.pth",
}
