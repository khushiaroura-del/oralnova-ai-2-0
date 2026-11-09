
from io import BytesIO
from pathlib import Path

import torch
import torch.nn as nn

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image, ImageOps, UnidentifiedImageError

from torchvision import transforms
from torchvision.models import mobilenet_v3_small

from ai.config.training_config import (
    CLINICAL_CONFIG,
    HISTOPATHOLOGY_CONFIG,
    NORMALIZATION,
    TRAINING,
)

from ai.gradcam import generate_gradcam_overlay


# ------------------------------------------
# ORALNOVA AI - Backend Application
# ------------------------------------------

app = FastAPI(
    title="ORALNOVA AI API",
    description="Educational research prototype for oral image analysis",
    version="2.1.0",
)


# ------------------------------------------
# CORS
# ------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------
# Configuration
# ------------------------------------------

DEVICE = torch.device(TRAINING["device"])

MODEL_CONFIGS = {
    "clinical": CLINICAL_CONFIG,
    "histopathology": HISTOPATHOLOGY_CONFIG,
}

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


# ------------------------------------------
# Model Loading
# ------------------------------------------

def load_model(model_type):

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


# ------------------------------------------
# Image Validation
# ------------------------------------------

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

        return image, image_format, width, height, len(contents)

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


# ------------------------------------------
# Image Preprocessing
# ------------------------------------------

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


# ------------------------------------------
# Prediction Engine
# ------------------------------------------

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


# ------------------------------------------
# Prediction + Grad-CAM Engine
# ------------------------------------------

def analyze_with_gradcam(image, model_type):

    model = load_model(model_type)
    config = MODEL_CONFIGS[model_type]

    prediction = predict_image(image, model_type)

    input_tensor = preprocess_image(image)

    try:
        # Generate Grad-CAM for the predicted class.
        # Do not wrap this call in torch.inference_mode().
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


# ------------------------------------------
# Home
# ------------------------------------------

@app.get("/")
def home():

    return {
        "project": "ORALNOVA AI",
        "status": "Backend is running",
        "purpose": "Educational research prototype",
    }


# ------------------------------------------
# Health Check
# ------------------------------------------

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
    }


# ------------------------------------------
# Technical Upload Validation
# ------------------------------------------

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):

    image, image_format, width, height, size = (
        await read_image(file)
    )

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


# ------------------------------------------
# Clinical Prediction
# ------------------------------------------

@app.post("/predict/clinical")
async def predict_clinical(file: UploadFile = File(...)):

    image, image_format, width, height, size = (
        await read_image(file)
    )

    result = predict_image(image, "clinical")

    result.pop("predicted_index")

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
        "grad_cam_status": "Not connected",
        "disclaimer": "Educational research only. Not a medical diagnosis.",
    }


# ------------------------------------------
# Histopathology Prediction
# ------------------------------------------

@app.post("/predict/histopathology")
async def predict_histopathology(file: UploadFile = File(...)):

    image, image_format, width, height, size = (
        await read_image(file)
    )

    result = predict_image(image, "histopathology")

    result.pop("predicted_index")

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
        "grad_cam_status": "Not connected",
        "disclaimer": "Educational research only. Not a medical diagnosis.",
    }


# ------------------------------------------
# Clinical Grad-CAM
# ------------------------------------------

@app.post("/gradcam/clinical")
async def clinical_gradcam(file: UploadFile = File(...)):

    image, image_format, width, height, size = (
        await read_image(file)
    )

    result = analyze_with_gradcam(image, "clinical")

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
        "disclaimer": "Educational research only. Not a medical diagnosis.",
    }


# ------------------------------------------
# Histopathology Grad-CAM
# ------------------------------------------

@app.post("/gradcam/histopathology")
async def histopathology_gradcam(file: UploadFile = File(...)):

    image, image_format, width, height, size = (
        await read_image(file)
    )

    result = analyze_with_gradcam(image, "histopathology")

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
        "disclaimer": "Educational research only. Not a medical diagnosis.",
    }
