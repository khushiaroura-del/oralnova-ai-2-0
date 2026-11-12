
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import json
import csv
import os

import torch
import torch.nn as nn

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Query,
)
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image, ImageOps, UnidentifiedImageError

from torchvision import transforms
from torchvision.models import mobilenet_v3_small

from ai.config.training_config import (
    CLINICAL_CONFIG,
    HISTOPATHOLOGY_CONFIG,
    HISTOPATHOLOGY_HIGH_RES_CONFIG,
    NORMALIZATION,
    TRAINING,
)

from ai.gradcam import generate_gradcam_overlay


# ==========================================
# ORALNOVA AI - Backend Application
# ==========================================

app = FastAPI(
    title="ORALNOVA AI API",
    description="Educational research prototype for oral image analysis",
    version="2.3.0",
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

# Local development and deployed Vercel frontend
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://oralnova-ai-2-0.vercel.app",
]

# Optional additional frontend origins through environment variable.
# Multiple origins can be comma-separated.
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "")

for origin in FRONTEND_ORIGINS.split(","):
    origin = origin.strip().rstrip("/")

    if origin and origin not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CONFIGURATION
# ==========================================

DEVICE = torch.device(TRAINING["device"])

MODEL_CONFIGS = {
    "clinical": CLINICAL_CONFIG,
    "histopathology": HISTOPATHOLOGY_CONFIG,
}

OUTPUT_DIR = Path(CLINICAL_CONFIG["manifest"]).parent

LOADED_MODELS = {}

IMAGE_SIZE = 224
MAX_FILE_SIZE = 10 * 1024 * 1024

IMAGE_TRANSFORM = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=NORMALIZATION["mean"],
        std=NORMALIZATION["std"],
    ),
])


# ==========================================
# DATABASE CONFIGURATION
# ==========================================

DATABASE_DIR = Path(__file__).resolve().parent / "data"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATABASE_DIR / "oralnova_history.db"


def get_db_connection():

    connection = sqlite3.connect(
        str(DATABASE_PATH),
        timeout=30,
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    with get_db_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_type TEXT NOT NULL,
                model_name TEXT NOT NULL,
                filename TEXT,
                prediction TEXT NOT NULL,
                model_score REAL NOT NULL,
                probabilities TEXT NOT NULL,
                analysis_type TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_history_created_at
            ON prediction_history(created_at)
        """)

        connection.commit()


def save_prediction_history(
    image_type,
    model_name,
    filename,
    prediction,
    model_score,
    probabilities,
    analysis_type,
):

    created_at = datetime.now(timezone.utc).isoformat()

    with get_db_connection() as connection:

        cursor = connection.execute(
            """
            INSERT INTO prediction_history (
                image_type,
                model_name,
                filename,
                prediction,
                model_score,
                probabilities,
                analysis_type,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                image_type,
                model_name,
                filename,
                prediction,
                model_score,
                json.dumps(probabilities),
                analysis_type,
                created_at,
            ),
        )

        connection.commit()

        return {
            "id": cursor.lastrowid,
            "created_at": created_at,
        }


def serialize_history_record(record):

    return {
        "id": record["id"],
        "image_type": record["image_type"],
        "model_name": record["model_name"],
        "filename": record["filename"],
        "prediction": record["prediction"],
        "model_score": record["model_score"],
        "probabilities": json.loads(record["probabilities"]),
        "analysis_type": record["analysis_type"],
        "created_at": record["created_at"],
    }


initialize_database()


# ==========================================
# RESEARCH SUMMARY HELPERS
# ==========================================

def load_json_file(file_path):

    path = Path(file_path)

    if not path.exists():

        return {
            "available": False,
            "path": str(path),
            "data": None,
            "message": "File not found.",
        }

    try:

        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        return {
            "available": True,
            "path": str(path),
            "data": data,
            "message": None,
        }

    except (json.JSONDecodeError, OSError) as error:

        return {
            "available": False,
            "path": str(path),
            "data": None,
            "message": str(error),
        }


def find_column(fieldnames, candidates):

    if not fieldnames:
        return None

    normalized = {
        str(name).strip().lower(): name
        for name in fieldnames
    }

    for candidate in candidates:

        if candidate in normalized:
            return normalized[candidate]

    return None


def read_manifest_summary(file_path):

    path = Path(file_path)

    if not path.exists():

        return {
            "available": False,
            "path": str(path),
            "total_images": None,
            "split_counts": {},
            "class_counts": {},
            "columns": [],
            "message": "Processed manifest not found.",
        }

    try:

        with path.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:

            reader = csv.DictReader(file)

            fieldnames = reader.fieldnames or []

            split_column = find_column(
                fieldnames,
                [
                    "split",
                    "dataset_split",
                    "partition",
                    "subset",
                ],
            )

            class_column = find_column(
                fieldnames,
                [
                    "class_name",
                    "class",
                    "label",
                    "diagnosis",
                    "category",
                    "target",
                ],
            )

            total_images = 0
            split_counts = {}
            class_counts = {}

            for row in reader:

                total_images += 1

                if split_column:

                    split_value = str(
                        row.get(split_column, "")
                    ).strip()

                    if split_value:

                        split_counts[split_value] = (
                            split_counts.get(split_value, 0) + 1
                        )

                if class_column:

                    class_value = str(
                        row.get(class_column, "")
                    ).strip()

                    if class_value:

                        class_counts[class_value] = (
                            class_counts.get(class_value, 0) + 1
                        )

        return {
            "available": True,
            "path": str(path),
            "total_images": total_images,
            "split_counts": split_counts,
            "class_counts": class_counts,
            "columns": fieldnames,
            "message": None,
        }

    except (OSError, csv.Error, UnicodeError) as error:

        return {
            "available": False,
            "path": str(path),
            "total_images": None,
            "split_counts": {},
            "class_counts": {},
            "columns": [],
            "message": str(error),
        }


def get_model_research_summary(
    model_type,
    config,
    evaluation_file,
    manifest_file,
):

    checkpoint_path = Path(config["output_weights"])

    evaluation_result = load_json_file(
        OUTPUT_DIR / evaluation_file
    )

    manifest_result = read_manifest_summary(
        OUTPUT_DIR / manifest_file
    )

    evaluation_data = evaluation_result["data"]

    return {
        "model_type": model_type,

        "model_name": "MobileNetV3-Small",

        "architecture": "MobileNetV3-Small",

        "num_classes": config["num_classes"],

        "class_mapping": config["class_mapping"],

        "input_resolution": config["image_size"],

        "checkpoint": {
            "path": str(checkpoint_path),
            "available": checkpoint_path.exists(),
            "loaded_in_memory": model_type in LOADED_MODELS,
        },

        "dataset": manifest_result,

        "evaluation": {
            "available": evaluation_result["available"],
            "path": evaluation_result["path"],
            "accuracy": (
                evaluation_data.get("accuracy")
                if evaluation_data
                else None
            ),
            "classification_report": (
                evaluation_data.get("classification_report")
                if evaluation_data
                else None
            ),
            "confusion_matrix": (
                evaluation_data.get("confusion_matrix")
                if evaluation_data
                else None
            ),
            "cancer_sensitivity": (
                evaluation_data.get("cancer_sensitivity")
                if evaluation_data
                else None
            ),
            "non_cancer_specificity": (
                evaluation_data.get("non_cancer_specificity")
                if evaluation_data
                else None
            ),
            "message": evaluation_result["message"],
        },
    }


def get_training_research_summary(config):

    return {
        "device": TRAINING.get("device"),
        "batch_size": TRAINING.get("batch_size"),
        "maximum_epochs": TRAINING.get("epochs"),
        "learning_rate": TRAINING.get("learning_rate"),
        "weight_decay": TRAINING.get("weight_decay"),
        "early_stopping_patience": TRAINING.get(
            "early_stopping_patience"
        ),
        "num_workers": TRAINING.get("num_workers"),

        "normalization": {
            "mean": NORMALIZATION.get("mean"),
            "std": NORMALIZATION.get("std"),
        },

        "augmentation": config.get("augmentation", {}),

        "completed_epochs": None,
        "best_epoch": None,
        "best_validation_loss": None,

        "training_history_available": False,

        "training_history_note": (
            "Completed epochs, best epoch and best validation loss "
            "are not available from training_config.py. "
            "They require a saved training history file."
        ),
    }


# ==========================================
# MODEL LOADING
# ==========================================

def load_model(model_type):

    if model_type not in MODEL_CONFIGS:

        raise HTTPException(
            status_code=400,
            detail="Invalid model type.",
        )

    if model_type in LOADED_MODELS:
        return LOADED_MODELS[model_type]

    config = MODEL_CONFIGS[model_type]

    checkpoint_path = Path(config["output_weights"])

    if not checkpoint_path.exists():

        raise HTTPException(
            status_code=503,
            detail=f"{model_type} model checkpoint not found.",
        )

    try:

        model = mobilenet_v3_small(weights=None)

        input_features = model.classifier[3].in_features

        model.classifier[3] = nn.Linear(
            input_features,
            config["num_classes"],
        )

        state_dict = torch.load(
            checkpoint_path,
            map_location=DEVICE,
        )

        model.load_state_dict(state_dict)

        model.to(DEVICE)
        model.eval()

        LOADED_MODELS[model_type] = model

        return model

    except Exception as error:

        print(f"MODEL LOADING ERROR: {error}")

        raise HTTPException(
            status_code=503,
            detail=f"Could not load {model_type} model.",
        )


# ==========================================
# IMAGE VALIDATION
# ==========================================

async def read_image(file: UploadFile):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Use JPEG, PNG or WEBP images.",
        )

    contents = await file.read(MAX_FILE_SIZE + 1)

    if len(contents) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="Image must be below 10 MB.",
        )

    try:

        image = Image.open(BytesIO(contents))
        image.load()

        image_format = image.format

        if image_format not in ["JPEG", "PNG", "WEBP"]:

            raise HTTPException(
                status_code=400,
                detail="Unsupported image format.",
            )

        image = ImageOps.exif_transpose(image)

        width, height = image.size

        if width < IMAGE_SIZE or height < IMAGE_SIZE:

            raise HTTPException(
                status_code=400,
                detail="Image dimensions must be at least 224 x 224.",
            )

        image = image.convert("RGB")

        return (
            image,
            image_format,
            width,
            height,
            len(contents),
        )

    except HTTPException:
        raise

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid or unreadable image.",
        )


# ==========================================
# IMAGE PREPROCESSING
# ==========================================

def preprocess_image(image):

    resized = ImageOps.contain(
        image,
        (IMAGE_SIZE, IMAGE_SIZE),
        method=Image.Resampling.BILINEAR,
    )

    canvas = Image.new(
        "RGB",
        (IMAGE_SIZE, IMAGE_SIZE),
        (255, 255, 255),
    )

    x = (IMAGE_SIZE - resized.width) // 2
    y = (IMAGE_SIZE - resized.height) // 2

    canvas.paste(resized, (x, y))

    tensor = IMAGE_TRANSFORM(canvas)

    return tensor.unsqueeze(0).to(DEVICE)


# ==========================================
# PREDICTION ENGINE
# ==========================================

def predict_image(image, model_type):

    model = load_model(model_type)
    config = MODEL_CONFIGS[model_type]

    input_tensor = preprocess_image(image)

    try:

        with torch.inference_mode():

            outputs = model(input_tensor)

            probabilities = torch.softmax(
                outputs,
                dim=1,
            )[0]

            predicted_index = int(
                probabilities.argmax().item()
            )

        class_names = {
            index: name
            for name, index in config["class_mapping"].items()
        }

        predicted_class = class_names[predicted_index]

        scores = {
            class_names[index]: round(
                float(probabilities[index].item()),
                6,
            )
            for index in range(len(class_names))
        }

        return {
            "prediction": predicted_class,
            "model_score": round(
                float(probabilities[predicted_index].item()),
                6,
            ),
            "probabilities": scores,
            "predicted_index": predicted_index,
        }

    except Exception as error:

        print(f"PREDICTION ERROR: {error}")

        raise HTTPException(
            status_code=500,
            detail="Image prediction failed.",
        )


# ==========================================
# GRAD-CAM ENGINE
# ==========================================

def analyze_with_gradcam(image, model_type):

    model = load_model(model_type)

    prediction = predict_image(
        image,
        model_type,
    )

    input_tensor = preprocess_image(image)

    try:

        visualization = generate_gradcam_overlay(
            model=model,
            input_tensor=input_tensor,
            target_index=prediction["predicted_index"],
        )

        return {
            "prediction": prediction["prediction"],
            "model_score": prediction["model_score"],
            "probabilities": prediction["probabilities"],
            "grad_cam_status": "Generated",
            "grad_cam": visualization,
            "explanation_note": (
                "Grad-CAM highlights image regions that influenced "
                "the model output. It is not a confirmed lesion map "
                "or a medical diagnosis."
            ),
        }

    except Exception as error:

        print(f"GRAD-CAM ERROR ({model_type}): {error}")

        raise HTTPException(
            status_code=500,
            detail="Grad-CAM generation failed.",
        )


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "project": "ORALNOVA AI",
        "status": "Backend is running",
        "purpose": "Educational research prototype",
        "version": "2.3.0",
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "device": str(DEVICE),

        "models": {
            name: {
                "checkpoint_available": Path(
                    config["output_weights"]
                ).exists(),

                "loaded": name in LOADED_MODELS,
            }

            for name, config in MODEL_CONFIGS.items()
        },

        "grad_cam": "Available",

        "database": {
            "available": DATABASE_PATH.exists(),
            "path": str(DATABASE_PATH),
        },

        "allowed_origins": ALLOWED_ORIGINS,
    }


# ==========================================
# DYNAMIC RESEARCH SUMMARY
# ==========================================

@app.get("/research/summary")
def get_research_summary():

    try:

        clinical = get_model_research_summary(
            model_type="clinical",
            config=CLINICAL_CONFIG,
            evaluation_file="clinical_evaluation.json",
            manifest_file="clinical_224_processed.csv",
        )

        histopathology = get_model_research_summary(
            model_type="histopathology",
            config=HISTOPATHOLOGY_CONFIG,
            evaluation_file="histopathology_evaluation.json",
            manifest_file="histopathology_224_processed.csv",
        )

        high_resolution_checkpoint = Path(
            HISTOPATHOLOGY_HIGH_RES_CONFIG["output_weights"]
        )

        training_summary = {
            "clinical": get_training_research_summary(
                CLINICAL_CONFIG
            ),

            "histopathology": get_training_research_summary(
                HISTOPATHOLOGY_CONFIG
            ),

            "histopathology_high_resolution": {
                "image_size": HISTOPATHOLOGY_HIGH_RES_CONFIG[
                    "image_size"
                ],
                "checkpoint_path": str(
                    high_resolution_checkpoint
                ),
                "checkpoint_available": (
                    high_resolution_checkpoint.exists()
                ),
                "note": (
                    "Checkpoint availability alone does not establish "
                    "that a completed training experiment was evaluated."
                ),
            },
        }

        clinical_count = clinical["dataset"]["total_images"]
        histopathology_count = histopathology["dataset"]["total_images"]

        total_images = None

        if (
            clinical_count is not None
            and histopathology_count is not None
        ):

            total_images = (
                clinical_count + histopathology_count
            )

        limitations = [
            (
                "The datasets are small and the reported evaluation "
                "results come from limited image-level test splits."
            ),
            (
                "Patient-level independence has not been established. "
                "Patient-level data leakage cannot be ruled out."
            ),
            (
                "External-institution generalization has not been assessed."
            ),
            (
                "Dataset labels and clinical provenance have not been "
                "independently clinically verified."
            ),
            (
                "Model scores are not clinically validated probabilities "
                "or medical confidence values."
            ),
            (
                "Grad-CAM visualizations show regions influencing model "
                "output, not confirmed lesion locations."
            ),
            (
                "The histopathology Ameloblastoma test class has only "
                "three images, so its reported metrics are unstable."
            ),
            (
                "This project is an educational research prototype, "
                "not a medical diagnostic system."
            ),
        ]

        return {
            "status": "success",

            "project": "ORALNOVA AI",

            "version": "2.3.0",

            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),

            "overview": {
                "total_processed_images": total_images,

                "clinical_images": clinical_count,

                "histopathology_images": histopathology_count,

                "number_of_models": 2,

                "device": str(DEVICE),
            },

            "datasets": {
                "clinical": clinical["dataset"],
                "histopathology": histopathology["dataset"],
            },

            "models": {
                "clinical": clinical,
                "histopathology": histopathology,
            },

            "training": training_summary,

            "research_configuration": {
                "random_seed": 42,
                "device": TRAINING.get("device"),
                "batch_size": TRAINING.get("batch_size"),
                "maximum_epochs": TRAINING.get("epochs"),
                "learning_rate": TRAINING.get("learning_rate"),
                "weight_decay": TRAINING.get("weight_decay"),
                "early_stopping_patience": TRAINING.get(
                    "early_stopping_patience"
                ),
                "num_workers": TRAINING.get("num_workers"),
                "normalization": NORMALIZATION,
            },

            "limitations": limitations,

            "disclaimer": (
                "ORALNOVA AI is an educational research prototype. "
                "It does not diagnose, confirm, or rule out oral cancer. "
                "Its predictions and visualizations must not be used "
                "for clinical decisions."
            ),
        }

    except Exception as error:

        print(f"RESEARCH SUMMARY ERROR: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not generate research summary.",
        )


# ==========================================
# TECHNICAL IMAGE UPLOAD
# ==========================================

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
):

    (
        image,
        image_format,
        width,
        height,
        size,
    ) = await read_image(file)

    return {
        "status": "success",
        "message": "Image technically validated.",
        "filename": file.filename,
        "format": image_format,
        "width": width,
        "height": height,
        "size_bytes": size,
        "analysis_status": "Not performed",
    }


# ==========================================
# CLINICAL PREDICTION
# ==========================================

@app.post("/predict/clinical")
async def predict_clinical(
    file: UploadFile = File(...),
):

    (
        image,
        image_format,
        width,
        height,
        size,
    ) = await read_image(file)

    result = predict_image(image, "clinical")
    result.pop("predicted_index")

    history = save_prediction_history(
        image_type="clinical",
        model_name="Clinical MobileNetV3-Small",
        filename=file.filename,
        prediction=result["prediction"],
        model_score=result["model_score"],
        probabilities=result["probabilities"],
        analysis_type="prediction",
    )

    return {
        "status": "success",
        "model": "Clinical MobileNetV3-Small",
        "image_type": "clinical",
        "filename": file.filename,
        "format": image_format,
        "width": width,
        "height": height,
        "size_bytes": size,
        **result,
        "history_id": history["id"],
        "created_at": history["created_at"],
        "grad_cam_status": "Not connected",
        "disclaimer": (
            "Educational research only. Not a medical diagnosis."
        ),
    }


# ==========================================
# HISTOPATHOLOGY PREDICTION
# ==========================================

@app.post("/predict/histopathology")
async def predict_histopathology(
    file: UploadFile = File(...),
):

    (
        image,
        image_format,
        width,
        height,
        size,
    ) = await read_image(file)

    result = predict_image(image, "histopathology")
    result.pop("predicted_index")

    history = save_prediction_history(
        image_type="histopathology",
        model_name="Histopathology MobileNetV3-Small",
        filename=file.filename,
        prediction=result["prediction"],
        model_score=result["model_score"],
        probabilities=result["probabilities"],
        analysis_type="prediction",
    )

    return {
        "status": "success",
        "model": "Histopathology MobileNetV3-Small",
        "image_type": "histopathology",
        "filename": file.filename,
        "format": image_format,
        "width": width,
        "height": height,
        "size_bytes": size,
        **result,
        "history_id": history["id"],
        "created_at": history["created_at"],
        "grad_cam_status": "Not connected",
        "disclaimer": (
            "Educational research only. Not a medical diagnosis."
        ),
    }


# ==========================================
# CLINICAL GRAD-CAM
# ==========================================

@app.post("/gradcam/clinical")
async def clinical_gradcam(
    file: UploadFile = File(...),
):

    (
        image,
        image_format,
        width,
        height,
        size,
    ) = await read_image(file)

    result = analyze_with_gradcam(image, "clinical")

    history = save_prediction_history(
        image_type="clinical",
        model_name="Clinical MobileNetV3-Small",
        filename=file.filename,
        prediction=result["prediction"],
        model_score=result["model_score"],
        probabilities=result["probabilities"],
        analysis_type="gradcam",
    )

    return {
        "status": "success",
        "model": "Clinical MobileNetV3-Small",
        "image_type": "clinical",
        "filename": file.filename,
        "format": image_format,
        "width": width,
        "height": height,
        "size_bytes": size,
        **result,
        "history_id": history["id"],
        "created_at": history["created_at"],
        "disclaimer": (
            "Educational research only. Not a medical diagnosis."
        ),
    }


# ==========================================
# HISTOPATHOLOGY GRAD-CAM
# ==========================================

@app.post("/gradcam/histopathology")
async def histopathology_gradcam(
    file: UploadFile = File(...),
):

    (
        image,
        image_format,
        width,
        height,
        size,
    ) = await read_image(file)

    result = analyze_with_gradcam(image, "histopathology")

    history = save_prediction_history(
        image_type="histopathology",
        model_name="Histopathology MobileNetV3-Small",
        filename=file.filename,
        prediction=result["prediction"],
        model_score=result["model_score"],
        probabilities=result["probabilities"],
        analysis_type="gradcam",
    )

    return {
        "status": "success",
        "model": "Histopathology MobileNetV3-Small",
        "image_type": "histopathology",
        "filename": file.filename,
        "format": image_format,
        "width": width,
        "height": height,
        "size_bytes": size,
        **result,
        "history_id": history["id"],
        "created_at": history["created_at"],
        "disclaimer": (
            "Educational research only. Not a medical diagnosis."
        ),
    }


# ==========================================
# GET PREDICTION HISTORY
# ==========================================

@app.get("/history")
def get_prediction_history(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    image_type: str | None = Query(default=None),
):

    if image_type not in [None, "clinical", "histopathology"]:

        raise HTTPException(
            status_code=400,
            detail="Invalid image_type filter.",
        )

    try:

        with get_db_connection() as connection:

            if image_type:

                total = connection.execute(
                    """
                    SELECT COUNT(*)
                    FROM prediction_history
                    WHERE image_type = ?
                    """,
                    (image_type,),
                ).fetchone()[0]

                records = connection.execute(
                    """
                    SELECT *
                    FROM prediction_history
                    WHERE image_type = ?
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                    """,
                    (image_type, limit, offset),
                ).fetchall()

            else:

                total = connection.execute(
                    """
                    SELECT COUNT(*)
                    FROM prediction_history
                    """
                ).fetchone()[0]

                records = connection.execute(
                    """
                    SELECT *
                    FROM prediction_history
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                    """
                ).fetchall()

        return {
            "status": "success",
            "total": total,
            "limit": limit,
            "offset": offset,
            "history": [
                serialize_history_record(record)
                for record in records
            ],
        }

    except sqlite3.Error as error:

        print(f"HISTORY DATABASE ERROR: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve prediction history.",
        )


# ==========================================
# HISTORY STATISTICS
# ==========================================

@app.get("/history/stats")
def get_history_stats():

    try:

        with get_db_connection() as connection:

            total = connection.execute(
                """
                SELECT COUNT(*)
                FROM prediction_history
                """
            ).fetchone()[0]

            clinical = connection.execute(
                """
                SELECT COUNT(*)
                FROM prediction_history
                WHERE image_type = 'clinical'
                """
            ).fetchone()[0]

            histopathology = connection.execute(
                """
                SELECT COUNT(*)
                FROM prediction_history
                WHERE image_type = 'histopathology'
                """
            ).fetchone()[0]

            prediction_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM prediction_history
                WHERE analysis_type = 'prediction'
                """
            ).fetchone()[0]

            gradcam_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM prediction_history
                WHERE analysis_type = 'gradcam'
                """
            ).fetchone()[0]

            recent = connection.execute(
                """
                SELECT *
                FROM prediction_history
                ORDER BY id DESC
                LIMIT 5
                """
            ).fetchall()

        return {
            "status": "success",
            "total_analyses": total,
            "clinical_analyses": clinical,
            "histopathology_analyses": histopathology,
            "prediction_analyses": prediction_count,
            "gradcam_analyses": gradcam_count,
            "recent_analyses": [
                serialize_history_record(record)
                for record in recent
            ],
        }

    except sqlite3.Error as error:

        print(f"HISTORY STATS ERROR: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve history statistics.",
        )


# ==========================================
# DELETE INDIVIDUAL HISTORY RECORD
# ==========================================

@app.delete("/history/{history_id}")
def delete_history_record(history_id: int):

    try:

        with get_db_connection() as connection:

            cursor = connection.execute(
                """
                DELETE FROM prediction_history
                WHERE id = ?
                """,
                (history_id,),
            )

            connection.commit()

            if cursor.rowcount == 0:

                raise HTTPException(
                    status_code=404,
                    detail="History record not found.",
                )

        return {
            "status": "success",
            "message": "History record deleted.",
            "history_id": history_id,
        }

    except HTTPException:
        raise

    except sqlite3.Error as error:

        print(f"HISTORY DELETE ERROR: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not delete history record.",
        )
