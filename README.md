# ORALNOVA AI 2.0
### AI-Assisted Oral Lesion Image Analysis

**Developed by Khushi Aroura and Akshara Bajpai**

ORALNOVA AI 2.0 is an educational research prototype exploring deep learning-based analysis of clinical oral images and oral histopathology images.

The project uses separate MobileNetV3-Small models for clinical and histopathology image classification, supported by Grad-CAM visualizations to explore image regions influencing model predictions.

> **Important:** ORALNOVA AI is an educational research prototype, not a medical diagnostic system. It cannot diagnose, confirm, or rule out oral cancer. Its outputs must not be used for clinical decisions or treatment.

---

## Project Contributors

- **Khushi Aroura**
- **Akshara Bajpai**

## Live Demo

- **Web Application:** https://oralnova-ai-2-0.vercel.app
- **Backend API:** https://oralnova-ai-2-0.onrender.com
- **Interactive API Documentation:** https://oralnova-ai-2-0.onrender.com/docs
- **GitHub Repository:** https://github.com/khushiaroura-del/oralnova-ai-2-0

## Features

- Clinical oral image analysis
- Oral histopathology image analysis
- Separate AI models for both image types
- Grad-CAM model activation visualization
- Image upload and validation
- Prediction history using SQLite
- Research dashboard with evaluation summaries
- PDF analysis report export
- Responsive frontend interface

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js

### Backend

- Python
- FastAPI
- PyTorch
- Torchvision
- SQLite
- Grad-CAM

## AI Models

The project uses two separate MobileNetV3-Small classification models.

### 1. Clinical Image Model

Designed for clinical oral cavity photographs.

Classification categories:

- Cancer
- Non-cancer

### 2. Histopathology Model

Designed for H&E-stained oral tissue histopathology images.

Classification categories:

- Normal
- Oral Squamous Cell Carcinoma (OSCC)
- Odontogenic Keratocyst (OKC)
- Ameloblastoma (Plexiform)
- Pleomorphic Adenoma (PA)

The two models are separate research pipelines and must only be used with their corresponding image types.

## Dataset and Evaluation

The following results were obtained using the project's current image-level test splits.

| Dataset | Images after cleaning | Test accuracy |
|---|---:|---:|
| Clinical | 107 | 82.35% |
| Histopathology | 298 | 95.56% |

These results represent experimental model performance on the available test splits. They do not establish clinical validity or performance on independent patient populations.

### Research Limitations

- Dataset labels and provenance have not been independently clinically verified.
- Patient-level independence cannot be established from the available metadata.
- Patient-level data leakage cannot be ruled out.
- External-institution generalization has not been assessed.
- The Ameloblastoma test subset contains only 3 images, making its evaluation metrics unstable.
- Model scores are not clinically validated probabilities or diagnostic confidence.
- Grad-CAM highlights regions influencing model predictions, not confirmed lesion locations.
- The datasets are limited in size and diversity.

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

## Local Installation and Setup

### Prerequisites

- Node.js and npm
- Python 3.11
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/khushiaroura-del/oralnova-ai-2-0.git
cd oralnova-ai-2-0
```

### 2. Run the Frontend

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

### 3. Run the Backend

Create a Python virtual environment if it does not already exist:

```powershell
py -3.11 -m venv backend\.venv
```

Activate it:

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

Install the backend dependencies according to the project's dependency configuration.

From the project root, configure the Python module path:

```powershell
$env:PYTHONPATH = (Get-Location).Path + "\backend"
```

Start the backend:

```powershell
python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
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
| POST | `/upload-image` | Image upload validation |
| POST | `/predict/clinical` | Clinical image prediction |
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

**Maximum upload size:** 10 MB

**Minimum image dimensions:** 224 × 224 pixels.

## Privacy and Data Handling

The current prototype uses SQLite for prediction history.

It does not provide production-grade authentication, access controls, or patient-data protection.

Do not upload identifiable patient information or use this prototype to store real patient records.

## Current Project Status

- Frontend implementation
- Backend API integration
- Clinical model integration
- Histopathology model integration
- Grad-CAM integration
- Prediction history
- Research dashboard
- PDF report export
- Responsive interface
- Vercel frontend deployment
- Render backend deployment
- Production build verification
- Deployed clinical pipeline testing
- Deployed histopathology pipeline testing

## Future Scope

- Evaluation on larger and more diverse datasets
- Patient-level dataset splitting where reliable patient identifiers are available
- Independent external validation
- Improved model interpretability research
- Additional robustness and reliability testing
- Stronger privacy and security controls

## Disclaimer

ORALNOVA AI 2.0 is intended strictly for educational and research purposes.

It is not a substitute for examination by a qualified healthcare professional, histopathological assessment, or medical advice.

Model predictions, model scores, and Grad-CAM visualizations must not be used to diagnose, rule out, or guide treatment of oral cancer.

---

## Project Contributors

**Khushi Aroura and Akshara Bajpai**

GitHub Repository: https://github.com/khushiaroura-del/oralnova-ai-2-0

**ORALNOVA AI 2.0 | Educational Research Prototype**