"""
🎙️ Cluaiz Voice Engine — Pillar F: The Ear, Mouth & Senses
Custom Docker microservice for STT, TTS (Dual Engine), and VAD.
ALL LOCAL MODELS — No cloud dependency.

Engines:
  STT → faster-whisper (CTranslate2, INT8 — 4x speed, 50% less VRAM)
  TTS → Piper TTS (ONNX, instant — real-time chat)
      → XTTS-v2 (PyTorch — premium quality, voice cloning)
  VAD → Silero VAD v5 (ONNX Runtime)

Endpoints:
  GET  /health         → Health check
  POST /stt            → Speech-to-Text
  POST /tts            → Text-to-Speech (Piper — fast, default)
  POST /tts/premium    → Text-to-Speech (XTTS-v2 — premium quality)
  POST /tts/stream     → Streaming TTS (Piper)
  POST /vad            → Voice Activity Detection
  GET  /voices         → List available voices
"""

import os
import uuid
import asyncio
import numpy as np
from io import BytesIO
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(title="Cluaiz Voice Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "/app/temp"
MODELS_DIR = "/app/models"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{MODELS_DIR}/piper", exist_ok=True)
os.makedirs(f"{MODELS_DIR}/xtts", exist_ok=True)

# ─── Config ──────────────────────────────────────────────────
STT_MODEL_SIZE = os.getenv("STT_MODEL", "turbo")
PIPER_VOICE = os.getenv("PIPER_VOICE", "en_US-lessac-medium")
XTTS_SPEAKER = os.getenv("XTTS_SPEAKER", "Claribel Dervla")

# ─── Lazy Loaded Models ─────────────────────────────────────
_whisper_model = None
_piper_model = None
_xtts_model = None
_vad_session = None


def get_whisper_model():
    """faster-whisper CTranslate2 — 4x speed, INT8 quantized."""
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"🧠 Loading faster-whisper: {STT_MODEL_SIZE}...")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = "int8" if device == "cpu" else "float16"
        _whisper_model = WhisperModel(STT_MODEL_SIZE, device=device, compute_type=compute_type)
        print(f"✅ faster-whisper loaded ({compute_type})")
    return _whisper_model


def get_piper_model():
    """Piper TTS — ONNX, instant, ~200MB RAM."""
    global _piper_model
    if _piper_model is None:
        from piper import PiperVoice
        import urllib.request

        model_dir = f"{MODELS_DIR}/piper"
        model_file = os.path.join(model_dir, f"{PIPER_VOICE}.onnx")
        config_file = os.path.join(model_dir, f"{PIPER_VOICE}.onnx.json")

        # Auto-download model if not present
        if not os.path.exists(model_file):
            base_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium"
            print(f"📥 Downloading Piper voice: {PIPER_VOICE}...")
            urllib.request.urlretrieve(f"{base_url}/en_US-lessac-medium.onnx", model_file)
            urllib.request.urlretrieve(f"{base_url}/en_US-lessac-medium.onnx.json", config_file)
            print("✅ Piper voice downloaded")

        _piper_model = PiperVoice.load(model_file, config_path=config_file)
        print(f"✅ Piper TTS loaded: {PIPER_VOICE}")
    return _piper_model


def get_xtts_model():
    """XTTS-v2 — Premium quality, voice cloning, ~2GB RAM."""
    global _xtts_model
    if _xtts_model is None:
        from TTS.api import TTS
        print("🧠 Loading XTTS-v2 (premium TTS)...")
        _xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
        print("✅ XTTS-v2 loaded (CPU mode)")
    return _xtts_model


def get_vad_session():
    """Silero VAD v5 — ONNX, <10ms detection."""
    global _vad_session
    if _vad_session is None:
        import onnxruntime as ort
        model_path = os.path.join(MODELS_DIR, "silero_vad.onnx")
        if not os.path.exists(model_path):
            import urllib.request
            print("📥 Downloading Silero VAD v5...")
            urllib.request.urlretrieve(
                "https://github.com/snakers4/silero-vad/raw/master/files/silero_vad.onnx",
                model_path
            )
        _vad_session = ort.InferenceSession(model_path)
        print("✅ Silero VAD v5 loaded")
    return _vad_session


# ─── Request Models ─────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    language: Optional[str] = "en"
    speed: Optional[float] = 1.0


# ─── Health ──────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "cluaiz-voice-engine",
        "version": "2.0.0",
        "engines": {
            "stt": f"faster-whisper CTranslate2 ({STT_MODEL_SIZE})",
            "tts_fast": f"piper-tts ({PIPER_VOICE})",
            "tts_premium": "xtts-v2 (multilingual, voice cloning)",
            "vad": "silero-vad-v5 (ONNX)"
        }
    }


# ─── STT: Speech-to-Text ────────────────────────────────────
@app.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: Optional[str] = None
):
    """faster-whisper CTranslate2 — 4x faster, INT8 quantized."""
    temp_path = None
    try:
        file_id = str(uuid.uuid4())
        temp_path = os.path.join(TEMP_DIR, f"{file_id}_{audio.filename}")
        content = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        model = get_whisper_model()
        segments, info = model.transcribe(temp_path, language=language, beam_size=5, vad_filter=True)

        text_segments = []
        full_text = ""
        for seg in segments:
            text_segments.append({"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip()})
            full_text += seg.text

        return {
            "status": "success",
            "text": full_text.strip(),
            "language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration": round(info.duration, 2),
            "segments": text_segments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT Error: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# ─── TTS FAST: Piper TTS (Real-time Chat) ───────────────────
@app.post("/tts")
async def tts_fast(request: TTSRequest):
    """
    Piper TTS — ONNX, instant response, ~0.1 sec latency.
    Use for: Real-time chat, live conversations.
    """
    try:
        import soundfile as sf
        import wave

        piper = get_piper_model()

        buffer = BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            piper.synthesize(request.text, wav_file)

        buffer.seek(0)
        return Response(
            content=buffer.read(),
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=piper_{uuid.uuid4().hex[:8]}.wav"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Piper TTS Error: {str(e)}")


@app.post("/tts/stream")
async def tts_fast_stream(request: TTSRequest):
    """Piper TTS streaming — chunks sent as they're generated."""
    try:
        import wave

        piper = get_piper_model()

        async def audio_generator():
            buffer = BytesIO()
            with wave.open(buffer, "wb") as wav_file:
                piper.synthesize(request.text, wav_file)
            buffer.seek(0)

            # Stream in chunks
            chunk_size = 4096
            while True:
                chunk = buffer.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        return StreamingResponse(audio_generator(), media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Piper Stream Error: {str(e)}")


# ─── TTS PREMIUM: XTTS-v2 (Best Quality) ────────────────────
@app.post("/tts/premium")
async def tts_premium(request: TTSRequest):
    """
    XTTS-v2 — Premium quality, multilingual, voice cloning capable.
    Use for: Voicemail, pre-recorded messages, premium voice.
    Slower (~3-6 sec) but sounds very natural & human.
    """
    temp_path = None
    try:
        tts = get_xtts_model()
        file_id = uuid.uuid4().hex[:8]
        temp_path = os.path.join(TEMP_DIR, f"xtts_{file_id}.wav")

        language = request.language or "en"
        speaker = request.voice or XTTS_SPEAKER

        tts.tts_to_file(
            text=request.text,
            file_path=temp_path,
            speaker=speaker,
            language=language
        )

        with open(temp_path, "rb") as f:
            audio_data = f.read()

        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=xtts_{file_id}.wav"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XTTS-v2 Error: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# ─── VAD: Voice Activity Detection ──────────────────────────
@app.post("/vad")
async def voice_activity_detection(
    audio: UploadFile = File(...),
    threshold: float = 0.5,
    sample_rate: int = 16000
):
    """Silero VAD v5 ONNX — <10ms speech detection."""
    temp_path = None
    wav_path = None
    try:
        import wave

        file_id = str(uuid.uuid4())
        temp_path = os.path.join(TEMP_DIR, f"{file_id}_{audio.filename}")
        content = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        wav_path = os.path.join(TEMP_DIR, f"{file_id}_16k.wav")
        process = await asyncio.create_subprocess_exec(
            "ffmpeg", "-i", temp_path, "-ar", str(sample_rate),
            "-ac", "1", "-f", "wav", wav_path, "-y",
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL
        )
        await process.wait()

        with wave.open(wav_path, "rb") as wf:
            audio_data = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

        session = get_vad_session()
        window_size = 512
        speech_segments = []
        is_speech = False
        speech_start = 0.0

        h = np.zeros((2, 1, 64), dtype=np.float32)
        c = np.zeros((2, 1, 64), dtype=np.float32)

        for i in range(0, len(audio_data) - window_size, window_size):
            chunk = audio_data[i:i + window_size].reshape(1, -1)
            ort_inputs = {"input": chunk, "h": h, "c": c, "sr": np.array([sample_rate], dtype=np.int64)}
            output, h, c = session.run(None, ort_inputs)
            prob = output[0][0]
            timestamp = i / sample_rate

            if prob >= threshold and not is_speech:
                is_speech = True
                speech_start = timestamp
            elif prob < threshold and is_speech:
                is_speech = False
                speech_segments.append({"start": round(speech_start, 3), "end": round(timestamp, 3), "duration": round(timestamp - speech_start, 3)})

        if is_speech:
            end_time = len(audio_data) / sample_rate
            speech_segments.append({"start": round(speech_start, 3), "end": round(end_time, 3), "duration": round(end_time - speech_start, 3)})

        total_speech = sum(s["duration"] for s in speech_segments)
        total_duration = len(audio_data) / sample_rate

        return {
            "status": "success",
            "speech_segments": speech_segments,
            "total_speech_duration": round(total_speech, 3),
            "total_audio_duration": round(total_duration, 3),
            "speech_percentage": round((total_speech / total_duration) * 100, 1) if total_duration > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VAD Error: {str(e)}")
    finally:
        for path in [temp_path, wav_path]:
            if path and os.path.exists(path):
                os.remove(path)


# ─── Voices ──────────────────────────────────────────────────
@app.get("/voices")
async def list_voices():
    """List available voices for both engines."""
    return {
        "piper": {
            "default": PIPER_VOICE,
            "speed": "instant (~0.1s)",
            "note": "ONNX, real-time chat use"
        },
        "xtts_v2": {
            "default": XTTS_SPEAKER,
            "speed": "3-6 sec per sentence (CPU)",
            "languages": ["en", "es", "fr", "de", "it", "pt", "pl", "tr", "ru", "nl", "cs", "ar", "zh", "ja", "hi", "hu", "ko"],
            "voice_cloning": True,
            "note": "Premium quality, multilingual"
        }
    }


# ─── Startup ────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    print("🎙️ Cluaiz Voice Engine v2.0 starting...")
    print(f"   STT:          faster-whisper CTranslate2 ({STT_MODEL_SIZE})")
    print(f"   TTS Fast:     Piper TTS ({PIPER_VOICE})")
    print(f"   TTS Premium:  XTTS-v2 (multilingual, voice cloning)")
    print(f"   VAD:          Silero VAD v5 (ONNX)")
    print("✅ Voice Engine ready on port 8080")
    print("   /tts         → Piper (instant, real-time)")
    print("   /tts/premium → XTTS-v2 (premium, slower)")
