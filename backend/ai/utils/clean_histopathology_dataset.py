
from pathlib import Path
from PIL import Image
import hashlib
import csv
import shutil

BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = BASE_DIR / "dataset" / "histopathology"

SOURCE_DIR = next(DATASET_DIR.rglob("Images"))
OUTPUT_DIR = DATASET_DIR / "cleaned"


def get_image_hash(path):
    """Hash normalized image pixels, including image dimensions."""
    with Image.open(path) as image:
        image.seek(0)
        rgb = image.convert("RGB")

        h = hashlib.sha256()
        h.update(str(rgb.size).encode())
        h.update(rgb.tobytes())

        return h.hexdigest()


def main():
    if OUTPUT_DIR.exists() and any(OUTPUT_DIR.rglob("*")):
        raise FileExistsError(
            f"Output folder is not empty: {OUTPUT_DIR}"
        )

    groups = {}

    for class_folder in sorted(SOURCE_DIR.iterdir()):
        if not class_folder.is_dir():
            continue

        for path in sorted(class_folder.iterdir()):
            if not path.is_file():
                continue

            try:
                image_hash = get_image_hash(path)
                groups.setdefault(image_hash, []).append(
                    (class_folder.name, path)
                )
            except Exception as error:
                print(f"Unreadable: {path.name} | {error}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    audit = []

    for image_hash, group in groups.items():
        labels = {label for label, _ in group}

        if len(labels) > 1:
            for label, path in group:
                audit.append([
                    path.name, label, image_hash,
                    "EXCLUDED_CROSS_CLASS_DUPLICATE"
                ])
            continue

        group.sort(key=lambda item: str(item[1]))
        keep_label, keep_path = group[0]

        destination = OUTPUT_DIR / keep_label / keep_path.name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(keep_path, destination)

        audit.append([
            keep_path.name, keep_label, image_hash, "KEPT"
        ])

        for label, path in group[1:]:
            audit.append([
                path.name, label, image_hash,
                "EXCLUDED_SAME_CLASS_DUPLICATE"
            ])

    report = OUTPUT_DIR / "cleaning_audit.csv"

    with report.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            "filename", "class_folder", "image_hash", "status"
        ])
        writer.writerows(audit)

    print("\nHISTOPATHOLOGY CLEANING REPORT")
    print("--------------------------------")

    for folder in sorted(OUTPUT_DIR.iterdir()):
        if folder.is_dir():
            count = sum(1 for p in folder.iterdir() if p.is_file())
            print(f"{folder.name}: {count} images")

    print("Total retained:",
          sum(row[3] == "KEPT" for row in audit))

    print("Same-class duplicates excluded:",
          sum(row[3] == "EXCLUDED_SAME_CLASS_DUPLICATE"
              for row in audit))

    print("Cross-class duplicates excluded:",
          sum(row[3] == "EXCLUDED_CROSS_CLASS_DUPLICATE"
              for row in audit))

    print(f"Audit report: {report}")
    print("Original dataset was not modified.")


if __name__ == "__main__":
    main()
