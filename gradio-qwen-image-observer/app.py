import base64
import mimetypes
import os
from pathlib import Path
from typing import List, Optional, Union

import gradio as gr
from openai import OpenAI


MODEL_ID = os.environ.get("LLM_MODEL", "")
API_KEY = os.environ.get("MODELSCOPE_API_KEY") or os.environ.get("MODELSCOPE_API_TOKEN", "")
BASE_URL = os.environ.get("MODELSCOPE_API_BASE", "https://api-inference.modelscope.ai/v1/")


NO_KEY_MESSAGE = """ModelScope API Token was not detected.

Please configure the following environment variable locally or in your Studio:

```bash
MODELSCOPE_API_KEY=your_ModelScope_token
```

You can also use `MODELSCOPE_API_TOKEN`. The token can be created from the ModelScope access token page."""

def image_to_data_url(image_path: str) -> str:
    path = Path(image_path)
    mime_type = mimetypes.guess_type(path.name)[0] or "image/png"
    with path.open("rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def build_message(prompt: str, image_path: Optional[str]) -> Union[List[dict], str]:
    user_prompt = prompt.strip() or "Please respond based on the current input."

    if not image_path:
        return user_prompt

    return [
        {"type": "text", "text": user_prompt},
        {"type": "image_url", "image_url": {"url": image_to_data_url(image_path)}},
    ]


def call_model(prompt: str, image_path: Optional[str]) -> str:
    if not API_KEY:
        return NO_KEY_MESSAGE

    if not MODEL_ID:
        return "Model ID was not detected. Please configure the model you want to try in Studio environment variables first."

    if not prompt.strip() and not image_path:
        return "Please enter a question or upload an image before submitting."

    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise and accurate AI assistant. Answer based on the user's text. If the user uploads an image and the selected model supports image input, use the image as additional context.",
                },
                {"role": "user", "content": build_message(prompt, image_path)},
            ],
            temperature=0.7,
            max_tokens=1200,
        )
        return response.choices[0].message.content
    except Exception as exc:
        return (
            "An error occurred while calling the model.\n\n"
            f"```text\n{exc}\n```\n\n"
            "Please check the model ID, API token, and API Inference quota. If you are testing a text-only model, do not upload an image; image input is only supported by multimodal models."
        )


APP_CSS = """
.gradio-container {
  max-width: 1080px !important;
  margin: 0 auto !important;
}

.intro {
  padding: 22px 0 10px;
}

.intro h1 {
  margin: 0 0 10px;
  font-size: 34px;
  line-height: 1.2;
}

.intro p {
  margin: 0;
  color: #5f6673;
  line-height: 1.7;
}

.model-note {
  margin: 12px 0 18px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}

.gradio-container button.primary {
  border: 1px solid #0f766e !important;
  background: linear-gradient(135deg, #0f766e, #15803d) !important;
  color: #ffffff !important;
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.18) !important;
}

.gradio-container button.primary:hover {
  border-color: #115e59 !important;
  background: linear-gradient(135deg, #115e59, #166534) !important;
}

.english-image-upload .upload-container .wrap {
  position: relative !important;
  color: transparent !important;
}

.english-image-upload .upload-container .wrap * {
  color: transparent !important;
}

.english-image-upload .upload-container .wrap:after {
  content: "Drag image here\\A- or -\\AClick to upload";
  white-space: pre;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.7;
  pointer-events: none;
}
"""


with gr.Blocks(title="ModelScope Model Playground", css=APP_CSS) as demo:
    gr.HTML(
        f"""
        <section class="intro">
          <h1>ModelScope Model Playground</h1>
          <p>Enter text to test a language model. To test a multimodal model, optionally upload an image as well. The app calls community models through ModelScope API Inference.</p>
        </section>
        <div class="model-note">Before running the app, configure <b>MODELSCOPE_API_KEY</b> in your Studio environment variables. Current model: <b>{MODEL_ID or "Not configured"}</b></div>
        """
    )

    with gr.Row(equal_height=False):
        with gr.Column(scale=1):
            prompt_input = gr.Textbox(
                label="Text input",
                placeholder="For example: introduce ModelScope Studios. When testing a multimodal model, you can also ask: describe this image in three sentences.",
                lines=6,
            )
            image_input = gr.Image(
                label="Upload image (optional, for multimodal models)",
                type="filepath",
                sources=["upload", "clipboard"],
                height=320,
                elem_classes=["english-image-upload"],
            )
            submit_btn = gr.Button("Submit to model", variant="primary")

        with gr.Column(scale=1):
            output = gr.Markdown(
                label="Model output",
                value="The model response will appear here.",
                height=480,
            )

    submit_btn.click(
        fn=call_model,
        inputs=[prompt_input, image_input],
        outputs=output,
    )


if __name__ == "__main__":
    demo.launch()
