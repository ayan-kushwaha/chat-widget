import json
from typing import Dict, Any, List, Optional
from loguru import logger
from google.genai import types

from src.core.routing.model_router import ModelRouter, TaskType
from src.services.context.business_dna import fetch_business_dna

class MarketingManager:
    """
     Manager for the Marketing & PR Department.
    Handles social media, campaigns, SEO, and sentiment analysis.
    """
    def __init__(self, org_id: str):
        self.org_id = org_id
        self._raw_skills = {}
        
    def _get_gemini_tools(self) -> List[types.Tool]:
        return []

    async def process_campaign_or_analysis(self, user_message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        try:
            dna = await fetch_business_dna(self.org_id)
            
            system_instruction = f"""You are the Head of Marketing and PR.
            BUSINESS CONTEXT: {dna.industry_cluster}. Product: {dna.product_overview}
            
            RULES:
            1. Help analyze customer sentiment and manage marketing campaigns.
            2. Protect brand integrity.
            3. Use your tools for deep social insights.
            """
            
            messages = history + [{"role": "user", "text": user_message}]
            
            from src.services.ai.chat_service import chat_ai_service
            config = {"system_instruction": system_instruction, "temperature": 0.5}
                
            response = await chat_ai_service.generate_content(
                contents=messages,
                config=config,
                model_type=TaskType.CORE_CHAT
            )
            
            return {"reply": response.text}
            
        except Exception as e:
            logger.error(f" [MarketingManager] Error: {e}")
            return {"reply": "Error in marketing analysis.", "error": str(e)}

def get_marketing_manager(org_id: str) -> MarketingManager:
    return MarketingManager(org_id)
