import re
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

#  Voice Service URL (Docker container)
VOICE_SERVICE_URL = "http://voice-service:8080"


class VoiceRequest(BaseModel):
    text: str
    engine: str = "piper"  # "piper" (fast) or "premium" (xtts-v2)
    voice_name: str = "en-US-AriaNeural"


def clean_text_for_tts(text: str) -> str:
    """Remove markdown artifacts from text before TTS."""
    if not text:
        return ""
    # 1. Remove Markdown Bold/Italic
    text = re.sub(r'\*+(?=[a-zA-Z0-9])|(?<=[a-zA-Z0-9])\*+', '', text)
    # 2. Remove List Bullets
    text = re.sub(r'^[\*\-]\s+', '', text, flags=re.MULTILINE)
    # 3. Remove Header hashes
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # 4. Remove Code Blocks
    text = re.sub(r'```', '', text)
    # 5. Remove residual asterisks
    text = text.replace('*', '')
    # 6. Remove Links
    text = re.sub(r'http[s]?://\S+', '', text)
    return text.strip()


@router.post("/stream")
async def stream_audio(request: VoiceRequest):
    """
    Stream TTS audio from voice-service (local).
    Engine: "piper" (local) or "premium" (local xtts).
    Cloud TTS (Edge) is now handled directly in the Frontend.
    """
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Clean markdown from text
    text = clean_text_for_tts(text)

    if not text:
        raise HTTPException(status_code=400, detail="Text is empty after cleanup")

    # Pick endpoint based on engine
    endpoint = "/tts/premium" if request.engine == "premium" else "/tts"

    try:
        async def audio_generator():
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{VOICE_SERVICE_URL}{endpoint}",
                    json={"text": text, "language": "en"}
                ) as response:
                    if response.status_code != 200:
                        raise HTTPException(status_code=500, detail="Voice service error")
                    async for chunk in response.aiter_bytes(4096):
                        yield chunk

        return StreamingResponse(audio_generator(), media_type="audio/wav")

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Voice service unavailable. Ensure voice-service container is running."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")
