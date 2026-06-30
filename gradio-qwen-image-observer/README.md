---
title: Qwen Multimodal Image Observatory
sdk: gradio
app_file: app.py
colorFrom: purple
colorTo: cyan
pinned: true
---

# Qwen Multimodal Image Observatory

This is a Gradio example for the ModelScope Studios getting-started tutorial. It calls `Qwen/Qwen3.5-35B-A3B` through ModelScope API Inference, lets users upload an image, and generates an image description, Studio showcase copy, anime-style character analysis, or extracted visual information.

The goal is not to load a large model inside the Studio. Instead, this example shows how to wrap a community model’s API Inference capability into a public, interactive Gradio frontend.

## Features

1. Upload an image and analyze it with a multimodal model.
2. Switch between image description, Studio showcase copy, anime character analysis, and information extraction.
3. Use a pixel-style interface to demonstrate Gradio layout and custom CSS.
4. Read the ModelScope token from environment variables instead of hardcoding secrets.

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `MODELSCOPE_API_KEY` | ModelScope API Inference token | Yes |
| `MODELSCOPE_API_TOKEN` | Fallback token variable if `MODELSCOPE_API_KEY` is not set | No |
| `LLM_MODEL` | Model ID, default `Qwen/Qwen3.5-35B-A3B` | No |
| `MODELSCOPE_API_BASE` | API Inference endpoint, default `https://api-inference.modelscope.cn/v1/` | No |

Token page: https://www.modelscope.cn/my/myaccesstoken

Link replacement required: replace the token page with the corresponding ModelScope international-site link if available.

## Run Locally

```bash
pip install -r requirements.txt
export MODELSCOPE_API_KEY="your ModelScope token"
python app.py
```

## Deploy to ModelScope Studio

Create a Gradio Studio and upload the following files:

```text
gradio-qwen-image-observer/
├── app.py
├── README.md
└── requirements.txt
```

In Deployment settings, select Gradio, Free CPU, and the recommended Environment. Then configure `MODELSCOPE_API_KEY` in Variables. After confirmation, the Studio will launch the Gradio page and call the model through API Inference.
