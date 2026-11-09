
const API_BASE_URL = "http://127.0.0.1:8000";

export type ImageType = "clinical" | "histopathology";

export interface ImageUploadResponse {
  status: string;
  message: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  size_bytes: number;
  model_status: string;
  grad_cam_status: string;
  analysis_status: string;
}

export interface PredictionResponse {
  status: string;
  model: string;
  image_type: ImageType;
  filename: string;
  format: string;
  width: number;
  height: number;
  size_bytes: number;
  prediction: string;
  model_score: number;
  probabilities: Record<string, number>;
  grad_cam_status: string;
  disclaimer: string;
}

export interface GradCamResponse extends PredictionResponse {
  grad_cam: {
    overlay: string;
    width: number;
    height: number;
    method: string;
    target_layer: string;
  };
}

async function postImage<T>(
  endpoint: string,
  file: File
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.detail || "Request failed."
    );
  }

  return result as T;
}

export async function uploadImageToBackend(
  file: File
): Promise<ImageUploadResponse> {
  return postImage<ImageUploadResponse>(
    "/upload-image",
    file
  );
}

export async function predictImage(
  file: File,
  imageType: ImageType
): Promise<PredictionResponse> {
  return postImage<PredictionResponse>(
    `/predict/${imageType}`,
    file
  );
}

export async function generateGradCam(
  file: File,
  imageType: ImageType
): Promise<GradCamResponse> {
  return postImage<GradCamResponse>(
    `/gradcam/${imageType}`,
    file
  );
}
