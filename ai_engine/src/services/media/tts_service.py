"""
 TTS Service  Calls voice-service for audio generation.
Replaces edge-tts (cloud) with local voice-service (Piper/XTTS-v2).
"""

import os
import uuid
import httpx
from src.core.config import settings

# Ensure directory exists
AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE_SERVICE_URL = "http://voice-service:8080"


class TTSService:
    """
    Local TTS via voice-service container.
    Piper (instant) for real-time, XTTS-v2 (premium) for quality.
    """

    BASE_URL = f"http://localhost:{settings.PORT}"

    @staticmethod
    async def generate_speech(text: str, engine: str = "piper") -> str:
        """
        Generates WAV audio via voice-service and returns the URL.
        engine: "piper" (fast) or "premium" (xtts-v2)
        """
        try:
            endpoint = "/tts/premium" if engine == "premium" else "/tts"

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{VOICE_SERVICE_URL}{endpoint}",
                    json={"text": text, "language": "en"}
                )

            if response.status_code != 200:
                print(f" Voice service returned {response.status_code}")
                return None

            filename = f"{uuid.uuid4()}.wav"
            file_path = os.path.join(AUDIO_DIR, filename)

            with open(file_path, "wb") as f:
                f.write(response.content)

            return f"{TTSService.BASE_URL}/static/audio/{filename}"

        except httpx.ConnectError:
            print(" Voice service unavailable  container not running?")
            return None
        except Exception as e:
            print(f" TTS Generation Failed: {e}")
            return None
