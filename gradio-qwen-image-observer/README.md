---
title: ModelScope Model Playground
sdk: gradio
app_file: app.py
colorFrom: teal
colorTo: green
pinned: true
---

# ModelScope Model Playground

This is a minimal Gradio example for the ModelScope Studios getting-started tutorial. It calls a community model through ModelScope API Inference and keeps only two inputs: a text prompt and an optional image. Users can test a text-only language model with text input alone. If `LLM_MODEL` points to a multimodal model, they can also upload an image for text-and-image interaction.

The goal is not to build a complex page. The example focuses on one core idea: connect a ModelScope community model to a public Gradio frontend.

## Features

1. Enter a text prompt and call ModelScope API Inference, which is enough for testing text-only language models.
2. Optionally upload an image; use image input only when `LLM_MODEL` points to a multimodal model.
3. Read the ModelScope token from environment variables instead of hardcoding secrets.
4. Switch the community model with the `LLM_MODEL` environment variable.

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `MODELSCOPE_API_KEY` | ModelScope API Inference token | Yes |
| `MODELSCOPE_API_TOKEN` | Fallback token variable if `MODELSCOPE_API_KEY` is not set | No |
| `LLM_MODEL` | ModelScope model ID to try, for example `Qwen/Qwen3.5-35B-A3B` | Yes |
| `MODELSCOPE_API_BASE` | API Inference endpoint, English site default `https://api-inference.modelscope.ai/v1/` | No |

Token page: https://www.modelscope.ai/my/myaccesstoken

## Run Locally

```bash
pip install -r requirements.txt
export MODELSCOPE_API_KEY="your ModelScope token"
export LLM_MODEL="Qwen/Qwen3.5-35B-A3B"
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

In Deployment settings, select Gradio, Free CPU, and the recommended Environment. Then configure `MODELSCOPE_API_KEY` and `LLM_MODEL` in Variables. For text-only models, use the text input only. For multimodal models, upload an image as an additional input. After confirmation, the Studio will launch the Gradio page and call the model through API Inference.
