import base64
import json
import re
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.vision import Observation


def validate_image(data_url: str) -> None:
    match = re.fullmatch(r"data:(image/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)", data_url)
    if not match:
        raise HTTPException(422, "Send a JPEG or PNG image as a base64 data URL.")
    try:
        size = len(base64.b64decode(match.group(2), validate=True))
    except ValueError as exc:
        raise HTTPException(422, "The image encoding is invalid.") from exc
    if size > settings.max_image_bytes:
        raise HTTPException(413, "Captured image is too large. Please capture again.")


def _history_text(history: list) -> str:
    if not history:
        return "No prior observations are available."
    return "\n".join(
        f"- {item.timestamp}: {item.scene_summary}; objects: " + ", ".join(f"{o.name} ({o.position})" for o in item.observations)
        for item in history
    )


async def analyze_image(image: str, question: str | None, history: list, mode: str = "scene") -> tuple[str, str, list[Observation]]:
    if not settings.vision_api_key or not settings.vision_model:
        raise HTTPException(503, "Vision is not configured. Set VISION_API_KEY and VISION_MODEL on the backend.")
    task = question or "Describe this indoor scene for a visually impaired person."
    ocr_instruction = "Read visible text in natural reading order. Transcribe only text you can see clearly; explicitly say when text is unreadable. Do not infer or invent text." if mode == "ocr" else ""
    prompt = f'''You are AccessOS, an indoor visual-assistance demo. Answer concisely and honestly. Task: {task}
Current image is the only current evidence. Give approximate left/centre/right position only if visible. Never claim precise distance, safety, or detections you cannot support.
{ocr_instruction}
Prior session observations (historical, not current evidence):\n{_history_text(history)}
If the user asks where something was last seen, answer explicitly as a last observed location, not a guarantee of its current location. If it was never observed, say so.
Return JSON only: {{"answer":"short speech-ready answer","scene_summary":"short current scene summary","observations":[{{"name":"object","position":"left|centre|right, optional foreground/background"}}]}}.'''
    payload = {"model": settings.vision_model, "messages": [{"role": "user", "content": [
        {"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": image}}
    ]}], "max_tokens": 350}
    try:
        async with httpx.AsyncClient(timeout=settings.vision_timeout_seconds) as client:
            response = await client.post(f"{settings.vision_base_url.rstrip('/')}/chat/completions", headers={"Authorization": f"Bearer {settings.vision_api_key}"}, json=payload)
        if response.status_code >= 400:
            raise HTTPException(502, "The vision provider could not analyze this image. Check backend vision settings.")
        content = response.json()["choices"][0]["message"]["content"]
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        raise HTTPException(502, "The vision provider response was unavailable. Please try again.")
    try:
        parsed = json.loads(content.removeprefix("```json").removesuffix("```").strip())
        answer = str(parsed.get("answer", "I could not interpret the scene.")).strip()
        summary = str(parsed.get("scene_summary", answer)).strip()
        observations = [Observation(name=str(x["name"])[:80], position=str(x["position"])[:80]) for x in parsed.get("observations", []) if isinstance(x, dict) and x.get("name") and x.get("position")][:12]
    except (json.JSONDecodeError, TypeError, KeyError):
        answer, summary, observations = str(content).strip()[:1000], str(content).strip()[:1000], []
    return answer or "I could not interpret the scene.", summary or answer, observations
