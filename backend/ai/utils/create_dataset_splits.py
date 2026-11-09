
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

PROJECT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

RANDOM_STATE = 42

DATASETS = {
    "clinical": {
        "manifest": OUTPUT_DIR / "clinical_manifest.csv",
        "expected_total": 107,
        "output": OUTPUT_DIR / "clinical_splits.csv",
    },
    "histopathology": {
        "manifest": OUTPUT_DIR / "histopathology_manifest.csv",
        "expected_total": 298,
        "output": OUTPUT_DIR / "histopathology_splits.csv",
    },
}


def create_splits(name, config):
    print(f"\n{'=' * 55}")
    print(f"{name.upper()} DATASET SPLITTING")
    print("=" * 55)

    df = pd.read_csv(config["manifest"])

    if len(df) != config["expected_total"]:
        raise ValueError(
            f"Expected {config['expected_total']} records, "
            f"found {len(df)}."
        )

    if df["image_path"].duplicated().any():
        raise ValueError("Duplicate image paths found.")

    # Verify that every image exists.
    missing = [
        path for path in df["image_path"]
        if not (PROJECT_DIR / path).is_file()
    ]

    if missing:
        raise FileNotFoundError(
            f"{len(missing)} image files are missing. "
            f"Example: {missing[0]}"
        )

    # First split: 70% training, 30% temporary.
    train_df, temp_df = train_test_split(
        df,
        train_size=0.70,
        random_state=RANDOM_STATE,
        stratify=df["label"]
    )

    # Second split: divide temporary data equally.
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=temp_df["label"]
    )

    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()

    train_df["split"] = "train"
    val_df["split"] = "validation"
    test_df["split"] = "test"

    result = pd.concat(
        [train_df, val_df, test_df],
        ignore_index=True
    )

    # Verify no image path appears in multiple splits.
    overlap = result.groupby("image_path")["split"].nunique()

    if (overlap > 1).any():
        raise ValueError("Data leakage: image found in multiple splits.")

    # Save split manifest.
    result = result.sample(
        frac=1,
        random_state=RANDOM_STATE
    ).reset_index(drop=True)

    result.to_csv(config["output"], index=False)

    print("\nSPLIT SUMMARY")
    print("-" * 40)

    for split_name in ["train", "validation", "test"]:
        subset = result[result["split"] == split_name]

        print(f"\n{split_name.upper()}: {len(subset)} images")
        print(subset["label"].value_counts().sort_index().to_string())

    print("\nTOTAL:", len(result))
    print("Missing images: 0")
    print("Image overlap between splits: 0")
    print("Saved:", config["output"])


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, config in DATASETS.items():
        create_splits(name, config)

    print("\n" + "=" * 55)
    print("ALL DATASET SPLITS CREATED SUCCESSFULLY")
    print("=" * 55)


if __name__ == "__main__":
    main()
