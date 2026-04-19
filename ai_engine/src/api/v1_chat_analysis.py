from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.services.ai.analysis_service import analysis_ai_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatAnalysisRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/analyze_chat")
async def analyze_chat(request: ChatAnalysisRequest):
    """
    Analyzes a chat session to extract summary, intent, and retention policy.
    Uses Gemini 2.0 Flash-Lite with 'Heavy Input, Light Output' architecture.
    """
    try:
        # Format transcript from messages
        transcript = ""
        for msg in request.messages:
            transcript += f"{msg.role.capitalize()}: {msg.content}\n"

        if not transcript.strip():
             return {
                "summary_hindi": "No content to analyze.",
                "retention_policy": "7_DAY",
                "action_required": False
            }

        # Call the Intelligence Engine (NEW Architecture)
        result = await analysis_ai_service.analyze_chat(transcript)
        
        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
