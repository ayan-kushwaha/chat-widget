from typing import List, Dict, Any, Optional
from loguru import logger
from pydantic import BaseModel, Field

from src.services.routing.local_llm_router import local_router


class ExtractedEntities(BaseModel):
    persons: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    amounts: List[str] = Field(default_factory=list)
    order_ids: List[str] = Field(default_factory=list)
    products: List[str] = Field(default_factory=list)

class EntityExtractor:
    """
    Iron Dome Layer: Entity Surgery
    Upgraded to use Qwen3:4b (Expert Brain) for robust, multilingual extraction.
    Replaces static SpaCy dictionary tech debt.
    """
    
    _SYSTEM_PROMPT = (
        "You are a master Entity Extraction JSON engine. "
        "Analyze the text and extract entities into exactly these lists: "
        "persons, locations, dates, amounts, order_ids, products. "
        "Return ONLY a valid JSON object matching this schema. NO MARKDOWN. NO EXPLANATIONS.\n\n"
        "Example Output:\n"
        "{\n"
        "  \"persons\": [\"Rahul\"],\n"
        "  \"locations\": [\"Mumbai\", \"Delhi\"],\n"
        "  \"dates\": [\"tomorrow\", \"12th Nov\"],\n"
        "  \"amounts\": [\"500\", \"$20\"],\n"
        "  \"order_ids\": [\"ORD-12345\"],\n"
        "  \"products\": [\"iPhone 15\", \"shoes\"]\n"
        "}"
    )
    
    @staticmethod
    async def extract(text: str) -> Dict[str, Any]:
        """
        Extracts semantic entities globally bypassing language limits.
        """
        prompt = f"Extract entities from this message:\n\n\"{text}\""
        
        try:
            # Stage 1: Fast local inference (0.6b model handles JSON schemas better locally)
            raw_str = await local_router.quick_classify(prompt=prompt, system=EntityExtractor._SYSTEM_PROMPT)
            
            # Simple fallback parser
            try:
                import re
                import json
                match = re.search(r"(\{.*\})", raw_str, re.DOTALL)
                result_dict = json.loads(match.group(1) if match else raw_str)
            except Exception:
                result_dict = {}
            
            # Validate and clean up using Pydantic model
            clean_entities = ExtractedEntities(**result_dict)
            return clean_entities.model_dump()
            
        except Exception as e:
            logger.error(f" [EntityExtractor] Format failed: {e}")
            # Safe Fallback to empty schema
            return ExtractedEntities().model_dump()
