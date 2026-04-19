import json
from typing import Dict, Any, List, Optional
from loguru import logger
from google.genai import types

from src.core.routing.model_router import ModelRouter, TaskType
from src.services.context.business_dna import fetch_business_dna

class WhatsappManager:
    """
     Manager for the WhatsApp Workflows.
    Handles cart recovery, proactive outreach, and WA specific chats.
    """
    def __init__(self, org_id: str):
        self.org_id = org_id
        self._raw_skills = {}
        
    def _get_gemini_tools(self) -> List[types.Tool]:
        return []

    async def process_whatsapp_message(self, user_message: str, history: List[Dict[str, str]], phone_number: str) -> Dict[str, Any]:
        try:
            dna = await fetch_business_dna(self.org_id)
            
            system_instruction = f"""You are the WhatsApp Sales and Support Manager.
            BUSINESS CONTEXT: {dna.industry_cluster}. 
            TONE: {dna.language_preference} - Keep messages short and friendly for WhatsApp.
            
            RULES:
            1. Handle inbound inquiries from WhatsApp.
            2. Trigger cart recovery workflows if requested.
            3. Use emojis naturally but professionally.
            """
            
            messages = history + [{"role": "user", "text": user_message}]
            
            from src.services.ai.chat_service import chat_ai_service
            config = {"system_instruction": system_instruction, "temperature": 0.4}
                
            response = await chat_ai_service.generate_content(
                contents=messages,
                config=config,
                model_type=TaskType.CORE_CHAT
            )
            
            return {"reply": response.text}
            
        except Exception as e:
            logger.error(f" [WhatsappManager] Error: {e}")
            return {"reply": "Sorry, temporary issue on WhatsApp.", "error": str(e)}

def get_whatsapp_manager(org_id: str) -> WhatsappManager:
    return WhatsappManager(org_id)
