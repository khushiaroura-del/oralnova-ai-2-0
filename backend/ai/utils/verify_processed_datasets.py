
from pathlib import Path
from collections import Counter

import pandas as pd
from PIL import Image


PROJECT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

CONFIGS = [
    {
        "name": "clinical",
        "size": 224,
        "manifest": OUTPUT_DIR / "clinical_224_processed.csv",
        "expected": 107,
    },
    {
        "name": "histopathology",
        "size": 224,
        "manifest": OUTPUT_DIR / "histopathology_224_processed.csv",
        "expected": 298,
    },
    {
        "name": "histopathology",
        "size": 384,
        "manifest": OUTPUT_DIR / "histopathology_384_processed.csv",
        "expected": 298,
    },
]


def verify(config):
    name = config["name"]
    size = config["size"]
    df = pd.read_csv(config["manifest"])

    print("\n" + "=" * 55)
    print(f"{name.upper()} {size}x{size} VERIFICATION")
    print("=" * 55)

    errors = []
    dimensions = Counter()
    modes = Counter()
    split_counts = Counter()

    for _, row in df.iterrows():
        path = PROJECT_DIR / row["processed_path"]

        try:
            with Image.open(path) as image:
                image.load()

                dimensions[image.size] += 1
                modes[image.mode] += 1

                if image.size != (size, size):
                    errors.append(f"Incorrect dimensions: {path}")

                if image.mode != "RGB":
                    errors.append(f"Incorrect color mode: {path}")

                split_counts[row["split"]] += 1

        except Exception as error:
            errors.append(f"{path}: {error}")

    print("Manifest records:", len(df))
    print("Expected records:", config["expected"])
    print("Verified images:", sum(dimensions.values()))
    print("Dimensions:", dict(dimensions))
    print("Color modes:", dict(modes))
    print("Split counts:", dict(split_counts))
    print("Errors:", len(errors))

    if len(df) != config["expected"]:
        errors.append("Manifest record count mismatch.")

    if len(dimensions) != 1 or (size, size) not in dimensions:
        errors.append("Not all images have the expected dimensions.")

    if set(modes) != {"RGB"}:
        errors.append("Not all images are RGB.")

    if errors:
        print("\nVERIFICATION FAILED")
        for error in errors[:15]:
            print(error)
        return False

    print("VERIFICATION PASSED")
    return True


def main():
    results = [verify(config) for config in CONFIGS]

    print("\n" + "=" * 55)

    if all(results):
        print("ALL PROCESSED DATASETS VERIFIED")
    else:
        print("SOME DATASETS NEED ATTENTION")

    print("=" * 55)


if __name__ == "__main__":
    main()
