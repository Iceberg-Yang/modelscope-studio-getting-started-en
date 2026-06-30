import base64
import mimetypes
import os
from pathlib import Path

import gradio as gr
from openai import OpenAI


MODEL_ID = os.environ.get("LLM_MODEL", "Qwen/Qwen3.5-35B-A3B")
API_KEY = os.environ.get("MODELSCOPE_API_KEY") or os.environ.get("MODELSCOPE_API_TOKEN", "")
BASE_URL = os.environ.get("MODELSCOPE_API_BASE", "https://api-inference.modelscope.ai/v1/")


SYSTEM_PROMPT = """You are a careful, friendly AI image analysis assistant with visual understanding abilities.
You are good at observing image content, identifying subjects, describing the atmosphere, and turning the result into copy that works well in a ModelScope Studio demo.
Be specific instead of generic. If the image does not provide enough information, clearly state what is uncertain."""


TASK_PROMPTS = {
    "Image description": "Describe the subject, scene, details, and overall atmosphere of the image.",
    "Studio showcase copy": "Generate a Studio-ready title, one-sentence summary, three highlights, and three tags based on the image.",
    "Anime character analysis": "Analyze the image from an anime character design perspective, including personality, outfit elements, color palette, and possible story background.",
    "Information extraction": "Extract visible text, objects, layout details, and information that could be useful for a project description.",
}


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


def build_user_content(image_path: str, task: str, question: str) -> list:
    task_prompt = TASK_PROMPTS.get(task, TASK_PROMPTS["Image description"])
    text = f"""Task: {task}

{task_prompt}

Additional user request:
{question.strip() or "Please provide a clear, specific, demo-friendly analysis."}

Use Markdown. Keep the structure clear and suitable for direct display in a Studio demo."""

    return [
        {"type": "text", "text": text},
        {"type": "image_url", "image_url": {"url": image_to_data_url(image_path)}},
    ]


def analyze_image(image_path: str, task: str, question: str, temperature: float) -> str:
    if not API_KEY:
        return NO_KEY_MESSAGE

    if not image_path:
        return "Please upload an image first, then click Analyze."

    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_content(image_path, task, question)},
            ],
            temperature=temperature,
            max_tokens=1200,
        )
        return response.choices[0].message.content
    except Exception as exc:
        return (
            "An error occurred while calling the model.\n\n"
            f"```text\n{exc}\n```\n\n"
            "Please check the model ID, API token, API Inference quota, and whether the model supports the current multimodal input format."
        )


PIXEL_CSS = """
:root {
  --ink: #201923;
  --paper: #f8f0d8;
  --panel: #fff8e8;
  --purple: #6b4eff;
  --blue: #36c6ff;
  --pink: #ff5aa5;
  --green: #7bd88f;
  --shadow: #201923;
}

.gradio-container {
  max-width: 1180px !important;
  margin: 0 auto !important;
  background:
    linear-gradient(45deg, rgba(32,25,35,0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(32,25,35,0.05) 25%, transparent 25%),
    var(--paper) !important;
  background-size: 18px 18px !important;
  color: var(--ink) !important;
  image-rendering: pixelated;
  font-family: "Courier New", "LXGW WenKai Mono", "Noto Sans Mono CJK SC", monospace !important;
}

.hero {
  position: relative;
  overflow: hidden;
  margin: 18px 0 14px;
  padding: 30px 34px 34px;
  border: 4px solid var(--ink);
  border-radius: 0;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
    linear-gradient(135deg, #fff6d8 0%, #ffe5f1 52%, #d9fbff 100%);
  background-size: 14px 14px, 14px 14px, auto;
  box-shadow: 8px 8px 0 var(--shadow);
}

.hero:before,
.hero:after {
  content: "";
  position: absolute;
  border: 4px solid var(--ink);
  opacity: 0.75;
  image-rendering: pixelated;
}

.hero:before {
  width: 96px;
  height: 96px;
  right: 32px;
  top: 28px;
  background:
    linear-gradient(var(--purple) 0 0) 0 0 / 24px 24px,
    linear-gradient(var(--blue) 0 0) 24px 24px / 24px 24px,
    linear-gradient(var(--pink) 0 0) 48px 48px / 24px 24px,
    #ffffff;
  background-repeat: no-repeat;
  box-shadow: 6px 6px 0 var(--shadow);
}

.hero:after {
  width: 18px;
  height: 18px;
  right: 158px;
  bottom: 34px;
  background: var(--green);
  box-shadow:
    24px 0 0 var(--blue),
    48px 0 0 var(--pink),
    0 24px 0 var(--pink),
    24px 24px 0 var(--purple),
    48px 24px 0 var(--green);
}

.eyebrow {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 3px solid var(--ink);
  border-radius: 0;
  background: #ffffff;
  box-shadow: 4px 4px 0 var(--shadow);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.hero h1 {
  margin: 18px 0 10px;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
  text-shadow: 3px 3px 0 #ffffff, 6px 6px 0 rgba(107,78,255,0.32);
}

.hero p {
  max-width: 720px;
  margin: 0;
  font-size: 16px;
  line-height: 1.75;
}

.panel-note {
  margin: 0 0 12px;
  padding: 12px 14px;
  border: 3px solid var(--ink);
  border-radius: 0;
  background: rgba(255,255,255,0.86);
  box-shadow: 5px 5px 0 var(--shadow);
  color: #45415f;
  font-size: 14px;
  line-height: 1.65;
}

.block, .form {
  border-radius: 0 !important;
}

.gradio-container .block {
  border-color: var(--ink) !important;
}

.gradio-container button.primary {
  border: 4px solid var(--ink) !important;
  border-radius: 0 !important;
  background: linear-gradient(135deg, var(--purple), var(--pink)) !important;
  box-shadow: 5px 5px 0 var(--ink) !important;
  color: white !important;
  font-weight: 800 !important;
  text-transform: uppercase;
}

.gradio-container button.secondary {
  border-radius: 0 !important;
}

textarea, input, select {
  border-radius: 0 !important;
  border-color: var(--ink) !important;
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
  color: #706c8e;
  font-size: 16px;
  line-height: 1.7;
  pointer-events: none;
}

.english-image-upload .upload-container .wrap:before {
  content: "↑";
  position: absolute;
  left: 50%;
  top: calc(50% - 78px);
  transform: translateX(-50%);
  color: #706c8e;
  font-size: 34px;
  line-height: 1;
  pointer-events: none;
  z-index: 1;
}

.footer {
  margin: 20px 0 4px;
  padding: 12px 4px;
  text-align: center;
  color: #706c8e;
  font-size: 13px;
}
"""


with gr.Blocks(title="Qwen Multimodal Image Observatory", css=PIXEL_CSS) as demo:
    gr.HTML(
        """
        <section class="hero">
          <div class="eyebrow">ModelScope API Inference · Gradio Studio Demo</div>
          <h1>Qwen Multimodal Image Observatory</h1>
          <p>
            Upload an image, choose an analysis task, and let Qwen/Qwen3.5-35B-A3B generate an image description,
            Studio showcase copy, or anime-style character analysis. This pixel-style demo shows how Gradio can
            wrap a community model into an accessible Studio application.
          </p>
        </section>
        """
    )

    gr.HTML(
        """
        <div class="panel-note">
          Before running the app, configure <b>MODELSCOPE_API_KEY</b> in your Studio environment variables.
          This demo does not load the model locally. It calls a community model through ModelScope API Inference,
          making it suitable for quick deployment and showcase scenarios.
        </div>
        """
    )

    with gr.Row(equal_height=False):
        with gr.Column(scale=5):
            image_input = gr.Image(
                label="Upload image",
                type="filepath",
                sources=["upload", "clipboard"],
                height=430,
                elem_classes=["english-image-upload"],
            )
            task_input = gr.Radio(
                label="Choose an analysis task",
                choices=list(TASK_PROMPTS.keys()),
                value="Studio showcase copy",
            )
            question_input = gr.Textbox(
                label="Additional request",
                value="Please write in a clear, structured tone suitable for a public demo.",
                lines=4,
                placeholder="For example: focus on the outfit, visual atmosphere, and generate a publish-ready title.",
            )
            temperature_input = gr.Slider(
                minimum=0.1,
                maximum=1.0,
                value=0.7,
                step=0.1,
                label="Temperature",
                info="Higher values make the output more creative; lower values make it more stable.",
            )
            submit = gr.Button("Analyze", variant="primary")

        with gr.Column(scale=6):
            output = gr.Markdown(
                label="Model output",
                value="Upload an image and the model analysis will appear here.",
                height=560,
            )

    submit.click(
        fn=analyze_image,
        inputs=[image_input, task_input, question_input, temperature_input],
        outputs=output,
    )

    gr.HTML(
        """
        <div class="footer">
          Built with Gradio · Powered by ModelScope API Inference · Model: Qwen/Qwen3.5-35B-A3B
        </div>
        """
    )


if __name__ == "__main__":
    demo.launch()
