
import base64
from io import BytesIO

import numpy as np
import torch

from PIL import Image

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image


def generate_gradcam_overlay(
    model,
    input_tensor,
    target_index,
):
    """
    Generate a Grad-CAM visualization from a trained model.

    Returns a base64 PNG data URL.
    This visualization is for educational research only.
    """

    if input_tensor.ndim != 4 or input_tensor.shape[0] != 1:
        raise ValueError(
            "Grad-CAM expects one image with shape [1, C, H, W]."
        )

    target_layer = model.features[-1]

    model.eval()
    model.zero_grad(set_to_none=True)

    with GradCAM(
        model=model,
        target_layers=[target_layer],
    ) as cam:

        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=[
                ClassifierOutputTarget(int(target_index))
            ],
        )[0]

    # Convert normalized input tensor back to RGB.
    mean = torch.tensor(
        [0.485, 0.456, 0.406],
        device=input_tensor.device,
    ).view(1, 3, 1, 1)

    std = torch.tensor(
        [0.229, 0.224, 0.225],
        device=input_tensor.device,
    ).view(1, 3, 1, 1)

    with torch.no_grad():
        rgb_tensor = input_tensor * std + mean
        rgb_tensor = rgb_tensor.clamp(0, 1)

    rgb_image = (
        rgb_tensor[0]
        .permute(1, 2, 0)
        .cpu()
        .numpy()
    )

    rgb_image = np.ascontiguousarray(
        rgb_image.astype(np.float32)
    )

    # Overlay actual Grad-CAM activation on the input image.
    visualization = show_cam_on_image(
        rgb_image,
        grayscale_cam,
        use_rgb=True,
    )

    output_image = Image.fromarray(visualization)

    buffer = BytesIO()
    output_image.save(buffer, format="PNG")

    encoded_image = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    return {
        "overlay": f"data:image/png;base64,{encoded_image}",
        "width": output_image.width,
        "height": output_image.height,
        "method": "Grad-CAM",
        "target_layer": "MobileNetV3-Small features[-1]",
    }
