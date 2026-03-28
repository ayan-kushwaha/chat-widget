from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
from loguru import logger
from huggingface_hub import snapshot_download

app = FastAPI(title="Turbo LLM Engine v3")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 128
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    think: Optional[bool] = False # MasterSwitch Handle

def ensure_model():
    model_name = "Qwen/Qwen3-4B-AWQ"
    model_path = os.getenv("MODEL_PATH", "/app/models/Qwen3-4B-AWQ")
    if not os.path.exists(model_path) or not os.listdir(model_path):
        logger.info(f"📥 Model not found at {model_path}. Starting Auto-Download...")
        snapshot_download(repo_id=model_name, local_dir=model_path, local_dir_use_symlinks=False)
        logger.success("✅ Download complete!")
    else:
        logger.info(f"✅ Model found at {model_path}")

from .engine_core import get_engine

@app.on_event("startup")
async def startup_event():
    ensure_model()
    _ = get_engine()
    logger.success("Turbo Engine is ready on Port 8000")

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    engine = get_engine()
    prompt = request.messages[-1].content
    
    if request.stream:
        async def stream_generator():
            request_id = f"chatcmpl-{int(time.time())}"
            # Passing MasterSwitch think flag to the engine
            for i, chunk in enumerate(engine.generate_stream(prompt, max_tokens=request.max_tokens, think=request.think)):
                data = {
                    "id": request_id,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": request.model,
                    "choices": [{
                        "index": 0,
                        "delta": {"content": chunk},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(data)}\n\n"
            
            # Final chunk
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    
    # Non-streaming response supporting MasterSwitch think flag
    response_text = engine.generate(prompt, max_tokens=request.max_tokens, think=request.think)
    return {
        "id": "turbo-123",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": response_text},
            "finish_reason": "stop"
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
