
from pathlib import Path

import pandas as pd
from PIL import Image, ImageOps


PROJECT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "processed"
MANIFEST_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

CONFIGS = [
    {
        "name": "clinical",
        "csv": MANIFEST_DIR / "clinical_splits.csv",
        "sizes": [224],
    },
    {
        "name": "histopathology",
        "csv": MANIFEST_DIR / "histopathology_splits.csv",
        "sizes": [224, 384],
    },
]


def load_rgb_image(image_path):
    with Image.open(image_path) as original:
        image = ImageOps.exif_transpose(original)

        # Handle transparent images without introducing black pixels.
        if "A" in image.getbands() or "transparency" in image.info:
            rgba = image.convert("RGBA")
            background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
            image = Image.alpha_composite(background, rgba).convert("RGB")
        else:
            image = image.convert("RGB")

        return image.copy()


def resize_with_padding(image, target_size):
    width, height = image.size

    scale = min(target_size / width, target_size / height)

    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))

    resized = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )

    canvas = Image.new(
        "RGB",
        (target_size, target_size),
        (255, 255, 255)
    )

    left = (target_size - new_width) // 2
    top = (target_size - new_height) // 2

    canvas.paste(resized, (left, top))

    return canvas


def process_dataset(config):
    name = config["name"]
    dataframe = pd.read_csv(config["csv"])

    print("\n" + "=" * 55)
    print(f"PROCESSING: {name.upper()}")
    print("=" * 55)

    for target_size in config["sizes"]:
        output_root = OUTPUT_DIR / f"{name}_{target_size}"
        records = []
        errors = []

        for _, row in dataframe.iterrows():
            source_path = PROJECT_DIR / row["image_path"]

            split = str(row["split"])
            label = str(row["label"])

            destination = (
                output_root / split / label / f"{source_path.stem}.png"
            )

            try:
                image = load_rgb_image(source_path)
                processed = resize_with_padding(image, target_size)

                destination.parent.mkdir(parents=True, exist_ok=True)
                processed.save(destination, format="PNG")

                records.append({
                    "dataset_type": name,
                    "source_path": str(row["image_path"]),
                    "processed_path": str(
                        destination.relative_to(PROJECT_DIR)
                    ),
                    "split": split,
                    "label": label,
                    "class_index": row["class_index"],
                    "width": target_size,
                    "height": target_size,
                })

            except Exception as error:
                errors.append({
                    "file": str(row["image_path"]),
                    "error": str(error),
                })

        manifest_path = (
            MANIFEST_DIR / f"{name}_{target_size}_processed.csv"
        )

        pd.DataFrame(records).to_csv(manifest_path, index=False)

        print(f"\nResolution: {target_size} x {target_size}")
        print("Processed:", len(records))
        print("Errors:", len(errors))
        print("Output folder:", output_root)
        print("Manifest:", manifest_path)

        if errors:
            print("\nERROR DETAILS:")
            for error in errors[:10]:
                print(error)

        if len(records) != len(dataframe):
            raise RuntimeError(
                f"{name} at {target_size}: processing incomplete."
            )


def main():
    for config in CONFIGS:
        process_dataset(config)

    print("\n" + "=" * 55)
    print("ALL PREPROCESSING JOBS COMPLETED")
    print("Original datasets were not modified.")
    print("=" * 55)


if __name__ == "__main__":
    main()
