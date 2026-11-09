
from pathlib import Path
import pandas as pd

# ==================================================
# PROJECT PATHS
# ==================================================

PROJECT_DIR = Path(__file__).resolve().parents[3]
DATASET_DIR = PROJECT_DIR / "backend" / "ai" / "dataset"

metadata_path = next(
    DATASET_DIR.rglob("Metadata.xlsx"),
    None
)

if metadata_path is None:
    raise FileNotFoundError("Metadata.xlsx not found.")

df = pd.read_excel(metadata_path)


# ==================================================
# 1. BASIC METADATA INFORMATION
# ==================================================

print("\nORALNOVA AI METADATA AUDIT")
print("=" * 50)

print("\n1. AVAILABLE COLUMNS")
print(list(df.columns))

print("\n2. TOTAL METADATA RECORDS")
print(len(df))


# ==================================================
# 2. MISSING VALUES
# ==================================================

print("\n3. MISSING VALUES")
print(df.isnull().sum().to_string())


# ==================================================
# 3. DIAGNOSIS DISTRIBUTION
# ==================================================

print("\n4. DIAGNOSIS DISTRIBUTION")

if "Diagnosis" in df.columns:
    print(
        df["Diagnosis"]
        .value_counts(dropna=False)
        .to_string()
    )


# ==================================================
# 4. INSTITUTION DISTRIBUTION
# ==================================================

print("\n5. INSTITUTION DISTRIBUTION")

if "institution" in df.columns:
    print(
        df["institution"]
        .value_counts(dropna=False)
        .to_string()
    )
else:
    print("Institution column not available.")


# ==================================================
# 5. STAIN DISTRIBUTION
# ==================================================

print("\n6. STAIN DISTRIBUTION")

if "Stain" in df.columns:
    print(
        df["Stain"]
        .value_counts(dropna=False)
        .to_string()
    )
else:
    print("Stain column not available.")


# ==================================================
# 6. PATIENT / SLIDE IDENTIFIER CHECK
# ==================================================

print("\n7. POSSIBLE PATIENT / SLIDE IDENTIFIERS")

possible_columns = [
    col for col in df.columns
    if any(
        word in str(col).lower()
        for word in [
            "patient",
            "subject",
            "case",
            "slide",
            "specimen",
            "sample",
            "id"
        ]
    )
]

if possible_columns:

    for col in possible_columns:

        print(f"\nColumn: {col}")
        print(
            "Unique values:",
            df[col].nunique(dropna=True)
        )
        print(
            "Missing values:",
            df[col].isnull().sum()
        )

else:
    print(
        "No explicit patient, case, slide "
        "or sample ID columns found."
    )


# ==================================================
# 7. DUPLICATE FILENAME CHECK
# ==================================================

print("\n8. DUPLICATE METADATA FILENAME CHECK")

required_duplicate_columns = {
    "File name",
    "Diagnosis"
}

if required_duplicate_columns.issubset(df.columns):

    duplicates = df[
        df.duplicated(
            subset=["File name", "Diagnosis"],
            keep=False
        )
    ]

    print(
        "Duplicate filename + diagnosis records:",
        len(duplicates)
    )

    if not duplicates.empty:
        print(duplicates.to_string(index=False))
    else:
        print(
            "No duplicate filename within "
            "the same diagnosis."
        )

else:
    print("Cannot perform duplicate filename check.")


# ==================================================
# 8. FILENAME DISTRIBUTION ACROSS CLASSES
# ==================================================

print("\n9. CLASS-WISE FILENAME INFORMATION")

if required_duplicate_columns.issubset(df.columns):

    for diagnosis, group in df.groupby("Diagnosis"):

        print(f"\n{diagnosis}")
        print("Records:", len(group))
        print(
            "Unique filenames:",
            group["File name"].nunique()
        )


# ==================================================
# 9. FINAL LIMITATIONS
# ==================================================

print("\n10. DATASET LIMITATIONS")
print("-" * 40)

if not possible_columns:
    print("- Patient/slide identifiers are unavailable.")

if "institution" in df.columns:
    print(
        "- Institution count:",
        df["institution"].nunique()
    )

print(
    "- Patient-level independence cannot be "
    "verified from the available metadata."
)

print(
    "- Metadata checks do not establish "
    "clinical label validity."
)


# ==================================================
# FINAL REPORT
# ==================================================

print("\n" + "=" * 50)
print("METADATA AUDIT COMPLETED")
print("=" * 50)
