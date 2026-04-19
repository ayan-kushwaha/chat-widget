from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from src.services.aiskills.engine.base_skill import BaseSkill
from src.core.groq_client import groq_client
from src.core.config import settings
from loguru import logger

class SentimentInput(BaseModel):
    text: str = Field(..., description="The user message to analyze sentiment for.")

class SentimentAnalyserSkill(BaseSkill):
    """
    Analyzes merchant/customer tone across multilingual interactions.
    """
    def __init__(self):
        super().__init__(
            name="sentiment_analysis",
            description="Analyzes the tone and mood of user messages across 200+ languages to track customer satisfaction."
        )
        self.client = groq_client
        self.model = settings.GROQ_MODEL

    @property
    def input_model(self) -> type[BaseModel]:
        return SentimentInput

    async def _run(self, params: SentimentInput, entities: Dict[str, Any], platform: str, **kwargs) -> Dict[str, Any]:
        """
        Performs multi-language sentiment analysis using LLM.
        """
        prompt = f"""
        Analyze the sentiment of this message.
        Text: "{params.text}"
        
        Return JSON with:
        - "score": float between -1.0 (very negative) and 1.0 (very positive)
        - "label": "Positive ", "Negative ", or "Neutral "
        - "detected_language": ISO code
        
        Return ONLY the JSON.
        """
        
        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            import json
            content = response.choices[0].message.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            result = json.loads(content)
            
            return {
                "label": result.get("label", "Neutral "),
                "score": result.get("score", 0.0),
                "language": result.get("detected_language", "auto"),
                "original_text": params.text
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            raise e

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

