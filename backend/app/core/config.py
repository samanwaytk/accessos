import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load the backend .env file explicitly
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)


class Settings(BaseModel):
    app_name: str = "AccessOS API"
    version: str = "2.0.0"
    frontend_origin: str = os.getenv(
        "FRONTEND_ORIGIN", "http://localhost:5173"
    )
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    vision_api_key: str = os.getenv("VISION_API_KEY", "")
    vision_model: str = os.getenv("VISION_MODEL", "")
    vision_base_url: str = os.getenv(
        "VISION_BASE_URL", "https://api.openai.com/v1"
    )
    vision_timeout_seconds: float = float(
        os.getenv("VISION_TIMEOUT_SECONDS", "30")
    )
    max_image_bytes: int = int(
        os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024))
    )


settings = Settings()