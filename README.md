# ORALNOVA AI 2.0
### AI-Assisted Oral Lesion Image Analysis

ORALNOVA AI 2.0 is an educational research prototype exploring deep learning-based analysis of clinical oral images and oral histopathology images.

The project uses separate MobileNetV3-Small models for clinical and histopathology image classification, with Grad-CAM visualizations to explore regions influencing model predictions.

> **Important:** ORALNOVA AI is an educational research prototype, not a medical diagnostic system. It cannot diagnose, confirm, or rule out oral cancer. Results must not be used for clinical decisions.

## Features

- Clinical oral image analysis
- Histopathology image analysis
- Separate AI models for both image types
- Grad-CAM visualization
- Image upload and validation
- Prediction history using SQLite
- Research dashboard with evaluation summaries
- PDF analysis report export
- Responsive frontend interface

## Technology Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js

**Backend**
- Python
- FastAPI
- PyTorch
- Torchvision
- SQLite
- Grad-CAM

## AI Models

The project uses two separate MobileNetV3-Small models.

### 1. Clinical Model

Classifies clinical oral images into:
- Cancer
- Non-cancer

### 2. Histopathology Model

Classifies histopathology images into:
- Normal
- Oral Squamous Cell Carcinoma
- Odontogenic Keratocyst
- Ameloblastoma (Plexiform)
- Pleomorphic Adenoma

## Dataset and Evaluation

| Dataset | Images after cleaning | Test accuracy |
|---|---:|---:|
| Clinical | 107 | 82.35% |
| Histopathology | 298 | 95.56% |

These are results from the project's current image-level test splits, not independent clinical validation.

**Research limitations:**
- Dataset labels and provenance have not been independently clinically verified.
- Patient-level independence cannot be established from the available metadata.
- Patient-level data leakage cannot be ruled out.
- External-institution generalization has not been assessed.
- The Ameloblastoma test subset contains only 3 images.
- Model scores are not clinically validated probabilities.
- Grad-CAM highlights influential image regions, not confirmed lesions.

## Project Structure

```text
oralnova-ai-2-0/
├── backend/
│   ├── ai/
│   │   ├── config/
│   │   ├── models/
│   │   ├── outputs/
│   │   ├── dataset/
│   │   └── utils/
│   ├── data/
│   └── main.py
├── src/
│   ├── app/
│   │   ├── analysis/
│   │   ├── dashboard/
│   │   └── components/
│   └── lib/
├── public/
├── package.json
└── README.md
```

## Run the Frontend

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

http://localhost:3000

## Run the Backend

From the project root in PowerShell:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Backend API:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend information |
| GET | `/health` | Health and model status |
| POST | `/upload-image` | Upload validation |
| POST | `/predict/clinical` | Clinical prediction |
| POST | `/predict/histopathology` | Histopathology prediction |
| POST | `/gradcam/clinical` | Clinical Grad-CAM |
| POST | `/gradcam/histopathology` | Histopathology Grad-CAM |
| GET | `/history` | Prediction history |
| GET | `/history/stats` | History statistics |
| GET | `/history/{history_id}` | Individual history record |
| DELETE | `/history/{history_id}` | Delete a history record |
| GET | `/research/summary` | Research summary |

## Supported Image Formats

- JPEG
- PNG
- WEBP

Maximum upload size: 10 MB.

## Privacy and Data Handling

The current prototype uses a local SQLite database for analysis history. It does not provide production-grade authentication or patient-data protection.

Do not upload identifiable patient information or use this prototype to store real patient records.

## Current Project Status

- Frontend implementation
- Backend API integration
- Clinical and histopathology model integration
- Grad-CAM integration
- Prediction history
- Research dashboard
- PDF report export
- Mobile responsiveness
- Production build verification

## Disclaimer

ORALNOVA AI 2.0 is intended strictly for educational and research purposes. It is not a substitute for examination by a qualified healthcare professional, histopathological assessment, or medical advice.

## Repository

GitHub: https://github.com/khushiaroura-del/oralnova-ai-2-0
