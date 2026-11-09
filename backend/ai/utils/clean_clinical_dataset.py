
from pathlib import Path
from PIL import Image
import hashlib
import csv
import shutil

# Original dataset
BASE_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = BASE_DIR / "dataset" / "clinical" / "OralCancer"

# Cleaned dataset
OUTPUT_DIR = BASE_DIR / "dataset" / "clinical" / "cleaned"

LABELS = ["cancer", "non-cancer"]


def get_image_hash(image_path):
    """Generate a hash from normalized image pixels."""
    with Image.open(image_path) as image:
        pixels = image.convert("RGB")
        image_hash = hashlib.sha256()
        image_hash.update(str(pixels.size).encode())
        image_hash.update(pixels.tobytes())
        return image_hash.hexdigest()


def main():
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Dataset not found: {SOURCE_DIR}")

    if OUTPUT_DIR.exists() and any(OUTPUT_DIR.rglob("*")):
        raise FileExistsError(
            f"Output folder is not empty: {OUTPUT_DIR}\n"
            "Please inspect it before running this script again."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    image_groups = {}

    for label in LABELS:
        folder = SOURCE_DIR / label

        for path in sorted(folder.rglob("*")):
            if not path.is_file():
                continue

            try:
                image_hash = get_image_hash(path)
                image_groups.setdefault(image_hash, []).append(
                    (label, path)
                )
            except Exception as error:
                print(f"Unreadable: {path.name} | {error}")

    audit_rows = []

    for image_hash, group in image_groups.items():
        labels = {label for label, _ in group}

        # Exclude identical images found in different classes.
        if len(labels) > 1:
            for label, path in group:
                audit_rows.append([
                    path.name,
                    label,
                    image_hash,
                    "EXCLUDED_CROSS_CLASS_DUPLICATE"
                ])
            continue

        # Keep only one copy of each same-class image.
        group.sort(key=lambda item: str(item[1]))
        keep_label, keep_path = group[0]

        destination = OUTPUT_DIR / keep_label / keep_path.name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(keep_path, destination)

        audit_rows.append([
            keep_path.name,
            keep_label,
            image_hash,
            "KEPT"
        ])

        for duplicate_label, duplicate_path in group[1:]:
            audit_rows.append([
                duplicate_path.name,
                duplicate_label,
                image_hash,
                "EXCLUDED_SAME_CLASS_DUPLICATE"
            ])

    report_path = OUTPUT_DIR / "cleaning_audit.csv"

    with report_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            "filename",
            "original_label",
            "image_hash",
            "status"
        ])
        writer.writerows(audit_rows)

    print("\nCLINICAL DATASET CLEANING REPORT")
    print("--------------------------------")

    for label in LABELS:
        count = len(list((OUTPUT_DIR / label).glob("*"))) \
            if (OUTPUT_DIR / label).exists() else 0
        print(f"{label}: {count} images")

    print("Total unique images retained:",
          sum(row[3] == "KEPT" for row in audit_rows))

    print("Cross-class duplicates excluded:",
          sum(row[3] == "EXCLUDED_CROSS_CLASS_DUPLICATE"
              for row in audit_rows))

    print("Same-class duplicate copies excluded:",
          sum(row[3] == "EXCLUDED_SAME_CLASS_DUPLICATE"
              for row in audit_rows))

    print(f"\nAudit report: {report_path}")
    print("Original dataset was not modified.")


if __name__ == "__main__":
    main()
