
from pathlib import Path
from collections import Counter
import pandas as pd
from PIL import Image, ImageOps

PROJECT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

DATASETS = {
    "clinical": OUTPUT_DIR / "clinical_splits.csv",
    "histopathology": OUTPUT_DIR / "histopathology_splits.csv",
}


def audit_dataset(name, manifest_path):
    print("\n" + "=" * 55)
    print(f"{name.upper()} IMAGE PREPROCESSING AUDIT")
    print("=" * 55)

    df = pd.read_csv(manifest_path)

    dimensions = Counter()
    modes = Counter()
    formats = Counter()
    aspect_ratios = []

    errors = []

    for relative_path in df["image_path"]:
        image_path = PROJECT_DIR / relative_path

        try:
            with Image.open(image_path) as image:
                image = ImageOps.exif_transpose(image)

                dimensions[image.size] += 1
                modes[image.mode] += 1
                formats[image.format] += 1

                width, height = image.size
                aspect_ratios.append(width / height)

                # Check whether image can be converted to RGB.
                image.convert("RGB")

        except Exception as error:
            errors.append({
                "file": str(relative_path),
                "error": str(error)
            })

    print("\nTOTAL IMAGES:", len(df))
    print("READABLE IMAGES:", len(df) - len(errors))
    print("UNREADABLE IMAGES:", len(errors))

    print("\nIMAGE FORMATS")
    for image_format, count in formats.most_common():
        print(f"{image_format}: {count}")

    print("\nCOLOR MODES")
    for mode, count in modes.most_common():
        print(f"{mode}: {count}")

    print("\nMOST COMMON DIMENSIONS")
    for size, count in dimensions.most_common(10):
        print(f"{size[0]} x {size[1]}: {count}")

    print("\nDIMENSION SUMMARY")
    print("Unique dimensions:", len(dimensions))
    print("Minimum width:", min(w for w, h in dimensions))
    print("Maximum width:", max(w for w, h in dimensions))
    print("Minimum height:", min(h for w, h in dimensions))
    print("Maximum height:", max(h for w, h in dimensions))

    print("\nASPECT RATIO")
    print("Minimum:", round(min(aspect_ratios), 3))
    print("Maximum:", round(max(aspect_ratios), 3))

    if errors:
        print("\nUNREADABLE IMAGE DETAILS")
        for item in errors[:10]:
            print(item)

    return {
        "dataset": name,
        "total": len(df),
        "readable": len(df) - len(errors),
        "unreadable": len(errors),
        "unique_dimensions": len(dimensions),
        "formats": dict(formats),
        "modes": dict(modes),
    }


def main():
    reports = []

    for name, manifest in DATASETS.items():
        reports.append(audit_dataset(name, manifest))

    report_path = OUTPUT_DIR / "image_preprocessing_audit.csv"

    pd.DataFrame(reports).to_csv(report_path, index=False)

    print("\n" + "=" * 55)
    print("IMAGE PREPROCESSING AUDIT COMPLETED")
    print("Report:", report_path)
    print("=" * 55)


if __name__ == "__main__":
    main()
