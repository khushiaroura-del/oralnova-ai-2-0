
from pathlib import Path
import pandas as pd

# ==================================================
# PROJECT PATHS
# ==================================================

PROJECT_DIR = Path(__file__).resolve().parents[3]
DATASET_DIR = PROJECT_DIR / "backend" / "ai" / "dataset"
OUTPUT_DIR = PROJECT_DIR / "backend" / "ai" / "outputs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ==================================================
# 1. CLINICAL DATASET
# ==================================================

clinical_dir = DATASET_DIR / "clinical" / "cleaned"

clinical_classes = {
    "cancer": 0,
    "non-cancer": 1
}

clinical_records = []

for class_name, class_index in clinical_classes.items():

    class_dir = clinical_dir / class_name

    if not class_dir.exists():
        raise FileNotFoundError(
            f"Clinical class folder not found: {class_dir}"
        )

    for image_path in sorted(class_dir.iterdir()):

        if image_path.is_file():

            clinical_records.append({
                "dataset_type": "clinical",
                "image_path": image_path.relative_to(
                    PROJECT_DIR
                ).as_posix(),
                "filename": image_path.name,
                "label": class_name,
                "class_index": class_index
            })

clinical_df = pd.DataFrame(clinical_records)


# ==================================================
# 2. HISTOPATHOLOGY DATASET
# ==================================================

histopath_dir = DATASET_DIR / "histopathology" / "cleaned"

metadata_path = next(
    DATASET_DIR.rglob("Metadata.xlsx"),
    None
)

if metadata_path is None:
    raise FileNotFoundError(
        "Histopathology Metadata.xlsx not found."
    )

metadata = pd.read_excel(metadata_path)

required_columns = {"File name", "Diagnosis"}

if not required_columns.issubset(metadata.columns):
    raise ValueError(
        "Required metadata columns are missing."
    )


# Folder name: (Exact Excel diagnosis, class index)

class_mapping = {
    "Class_0 Normal": (
        "Normal", 0
    ),

    "Class_1 Oral Squamous Cell Carcinoma": (
        "Oral Squamous Cell Carcinoma", 1
    ),

    "Class_2 Odontogenic Keratocyst": (
        "Odontogenic Keratocyst", 2
    ),

    "Class_3 Ameloblastoma (Plexiform)": (
        "Ameloblastoma (Plexiform)", 3
    ),

    "Class_4 Pleomorphic Adenoma": (
        "Pleomorphic Adenoma", 4
    )
}

histopath_records = []

# Normalize metadata filenames without extensions.
metadata["filename_stem"] = (
    metadata["File name"]
    .astype(str)
    .apply(lambda name: Path(name.strip()).stem)
)

metadata["Diagnosis"] = (
    metadata["Diagnosis"]
    .astype(str)
    .str.strip()
)

for folder_name, (diagnosis, class_index) in class_mapping.items():

    class_dir = histopath_dir / folder_name

    if not class_dir.exists():
        raise FileNotFoundError(
            f"Histopathology class folder not found: {class_dir}"
        )

    for image_path in sorted(class_dir.iterdir()):

        if not image_path.is_file():
            continue

        matches = metadata[
            (metadata["Diagnosis"] == diagnosis)
            & (
                metadata["filename_stem"]
                == image_path.stem
            )
        ]

        if len(matches) != 1:
            raise ValueError(
                f"Metadata mismatch: {image_path.name} "
                f"({folder_name}), matches={len(matches)}"
            )

        histopath_records.append({
            "dataset_type": "histopathology",
            "image_path": image_path.relative_to(
                PROJECT_DIR
            ).as_posix(),
            "filename": image_path.name,
            "label": diagnosis,
            "class_index": class_index
        })

histopath_df = pd.DataFrame(histopath_records)


# ==================================================
# 3. VALIDATE RECORD COUNTS
# ==================================================

if len(clinical_df) != 107:
    raise ValueError(
        f"Expected 107 clinical records, got {len(clinical_df)}"
    )

if len(histopath_df) != 298:
    raise ValueError(
        f"Expected 298 histopathology records, got {len(histopath_df)}"
    )

combined_df = pd.concat(
    [clinical_df, histopath_df],
    ignore_index=True
)

if len(combined_df) != 405:
    raise ValueError(
        f"Expected 405 combined records, got {len(combined_df)}"
    )


# ==================================================
# 4. SAVE MANIFEST FILES
# ==================================================

clinical_df.to_csv(
    OUTPUT_DIR / "clinical_manifest.csv",
    index=False
)

histopath_df.to_csv(
    OUTPUT_DIR / "histopathology_manifest.csv",
    index=False
)

combined_df.to_csv(
    OUTPUT_DIR / "combined_manifest.csv",
    index=False
)


# ==================================================
# 5. FINAL REPORT
# ==================================================

print("\n" + "=" * 45)
print("       ORALNOVA AI DATASET MANIFEST")
print("=" * 45)

print("\nCLINICAL DATASET")
print("-" * 30)
print("Total images:", len(clinical_df))
print(clinical_df["label"].value_counts().to_string())

print("\nHISTOPATHOLOGY DATASET")
print("-" * 30)
print("Total images:", len(histopath_df))
print(histopath_df["label"].value_counts().to_string())

print("\nCOMBINED DATASET")
print("-" * 30)
print("Total records:", len(combined_df))

print("\nGENERATED FILES")
print("-" * 30)
print(OUTPUT_DIR / "clinical_manifest.csv")
print(OUTPUT_DIR / "histopathology_manifest.csv")
print(OUTPUT_DIR / "combined_manifest.csv")

print("\n" + "=" * 45)
print("MANIFEST GENERATION COMPLETED")
print("=" * 45)
