from typing import Dict, List, Any, Optional
import re
import json
import asyncio
from src.core.groq_client import groq_client
from src.core.config import settings
from loguru import logger

class LanguageProcessor:
    """
    Universal language processor with extensible pattern support.
    Currently optimized for Hinglish, expandable to other languages.
    """
    
    def __init__(self):
        self.client = groq_client
        self.model = settings.GROQ_MODEL

    async def detect_intent_type(self, text: str) -> str:
        """
        Classify user intent using LLM (language-agnostic).
        Returns: "affirm", "deny", "query", or "statement".
        """
        prompt = f"""
        Classify the intent of this message.
        Possible categories:
        - "affirm": Yes, OK, proceed, do it, agreement.
        - "deny": No, stop, wait, cancellation, disagreement.
        - "query": Question, asking for information (what, where, how much, etc).
        - "statement": Simple statement, greeting, or unclear.

        Text: "{text}"
        
        Return ONLY the category name in lowercase. No explanation.
        """
        
        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            intent = response.choices[0].message.content.strip().lower()
            
            valid_intents = ["affirm", "deny", "query", "statement"]
            if intent in valid_intents:
                return intent
                
            # Fallback if LLM is verbose
            for valid in valid_intents:
                if valid in intent:
                    return valid
            
            return "statement"
        except Exception as e:
            logger.error(f"Intent detection failed: {e}")
            return "statement"
    
    async def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract entities using LLM (language-agnostic).
        Extracts: price, quantity, product_name, date.
        """
        prompt = f"""
        Extract entities from this message as JSON.
        Fields: product_name (str), price (float), quantity (int), date (str), currency (str).
        Use null for missing fields.

        Text: "{text}"
        
        Return ONLY the JSON object. No explanation.
        """
        
        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            content = response.choices[0].message.content.strip()
            
            # Clean JSON if LLM added backticks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            entities = json.loads(content)
            return entities
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return {}

    async def extract_schema_entities(self, text: str, schema_json: str, context_package: Optional[Any] = None) -> Dict[str, Any]:
        """
        Extracts entities specifically conforming to a provided JSON schema (from Pydantic).
        Crucial for Batch 6 Advanced Slot Filling.
        """
        # Inject memory and DNA context to help extraction if available
        context_str = ""
        user_id = ""
        if context_package:
            context_str = f"Past Conversation Context: {context_package.session_memory.get('short_term_history', '')}"
            user_id = context_package.employee_id
            
        prompt = f"""
        Extract parameter values from the user's message based strictly on the JSON schema provided below.
        
        {context_str}
        
        MESSAGE: "{text}"
        
        SCHEMA:
        {schema_json}
        
        RULES:
        1. Return ONLY a valid JSON object matching the schema properties.
        2. If a value isn't present in the message or context, omit the key or set it to null.
        3. No conversational text, only the raw JSON.
        """
        
        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            content = response.choices[0].message.content.strip()
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            entities = json.loads(content)
            return entities
        except Exception as e:
            logger.error(f"Schema-based extraction failed: {e}")
            return {}

    async def detect_language(self, text: str) -> str:
        """Detect ISO language code using LLM."""
        prompt = f"""What is the ISO 639-1 language code for this text: "{text}"? Return ONLY the code (e.g. en, hi, es)."""
        
        # Fast Script-Based Detection (Optimization)
        # Check specific unicode ranges
        for char in text:
            code = ord(char)
            if 0x0900 <= code <= 0x097F: return "hi" # Devanagari (Hindi)
            if 0x0C00 <= code <= 0x0C7F: return "te" # Telugu
            if 0x0C80 <= code <= 0x0CFF: return "kn" # Kannada
            if 0x0D00 <= code <= 0x0D7F: return "ml" # Malayalam
            if 0x0600 <= code <= 0x06FF: return "ur" # Arabic (Urdu)

        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            return response.choices[0].message.content.strip().lower()
        except Exception:
            return "en"


class ConversationMemory:
    """Multi-turn context manager (language-agnostic)."""
    
    def __init__(self):
        self.history: List[Dict[str, str]] = []
        self.slots: Dict[str, Any] = {}
    
    def add_turn(self, role: str, message: str):
        """Add a conversation turn."""
        self.history.append({"role": role, "message": message})
        if len(self.history) > 10:  # Keep last 10 turns
            self.history.pop(0)
    
    def get_context(self, last_n: int = 3) -> str:
        """Get recent conversation context."""
        recent = self.history[-last_n:] if len(self.history) >= last_n else self.history
        return "\n".join([f"{t['role']}: {t['message']}" for t in recent])
    
    def update_slot(self, key: str, value: Any):
        """Store extracted slot data."""
        self.slots[key] = value
    
    def clear(self):
        """Reset conversation."""
        self.history = []
        self.slots = {}

class EmotionalResponder:
    """Generate character-driven responses (expandable to multiple languages)."""
    
    # Hinglish templates (can add Spanish, French, etc.)
    SUCCESS_TEMPLATES = {
        "hinglish": [
            "Boss, kaam ho gaya! {detail}",
            "Done Boss! {detail}",
            "Perfect! {detail}",
            " Badiya! {detail}"
        ],
        "spanish": [
            "Listo jefe! {detail}",
            "Perfecto! {detail}"
        ], 
        "spanish": [
            "Listo jefe! {detail}",
            "Perfecto! {detail}"
        ],
        "hi": [ # Pure Hindi
            "  ! {detail}",
            " ! {detail}",
            ",     {detail}"
        ],
        "ur": [ # Urdu
            "    ! {detail}",
            " ! {detail}"
        ],
        "te": [ # Telugu
            " ! {detail}",
            "! {detail}"
        ],
        "kn": [ # Kannada
            " ! {detail}",
            "! {detail}"
        ],
        "ml": [ # Malayalam
            " ! {detail}",
            "! {detail}"
        ]
    }
    
    ERROR_TEMPLATES = {
        "hinglish": [
            "Sorry Boss, thodi problem aa gayi: {error}",
            "Arre, kuch gadbad ho gayi: {error}",
            "Boss maafi chahta hoon, {error}"
        ],
        "spanish": [
            "Lo siento jefe, hubo un problema: {error}"
        ],
        "hi": [
            " ,    : {error}",
            " ,    : {error}"
        ],
        "ur": [
            "        : {error}",
            "    : {error}"
        ],
        "te": [
            ",   : {error}",
            ",   : {error}"
        ],
        "kn": [
            ",   : {error}",
            ",  : {error}"
        ],
        "ml": [
            ",  : {error}",
            ",  : {error}"
        ]
    }
    
    IRRELEVANT_TEMPLATES = {
        "en": [
            "I'm afraid I can only help with business matters. Let's get back to work?",
            "That's outside my expertise. I stick to sales and support.",
            "Let's focus on what I can do for you - like checking products or orders."
        ],
        "hinglish": [
            "Boss, main sirf dhande ki baat karta hoon. Business pe wapis aayein?",
            "Arre sir, ye sab main nahi samajhta. Product ya order ki baat karein?",
            "Ye mere syllabus se bahar hai boss! Kaam ki baat karte hain."
        ],
        "hi": [
            " ,        ",
            "               ?"
        ],
        "ur": [
            "           ",
            "            "
        ]
    }
    
    @staticmethod
    def generate_success(detail: str, language: str = "hinglish") -> str:
        """Generate a success response in specified language."""
        import random
        templates = EmotionalResponder.SUCCESS_TEMPLATES.get(language, EmotionalResponder.SUCCESS_TEMPLATES["hinglish"])
        template = random.choice(templates)
        return template.format(detail=detail)
    
    def generate_error(self, error_msg: str, language: str = "en") -> str:
        """Selects an error template based on language."""
        # Clean language code (remove region)
        lang_base = language.split('-')[0].lower()
        if lang_base not in self.ERROR_TEMPLATES:
            # Fallback to English/Hinglish if template missing
            lang_base = "hinglish" if lang_base == "hi" else "en"
            
        import random
        template = random.choice(self.ERROR_TEMPLATES.get(lang_base, self.ERROR_TEMPLATES["en"]))
        return template.format(error=error_msg)

    def generate_irrelevant(self, language: str = "en") -> str:
        """Selects a deflection template for off-topic queries."""
        lang_base = language.split('-')[0].lower()
        # Mapping specific indic codes to hinglish if template missing, or en
        if lang_base in ['hi', 'ur']: 
             # Use specific if available, else Hinglish for casual feel
             pass
        elif lang_base not in self.IRRELEVANT_TEMPLATES:
             lang_base = "hinglish" # Default to Hinglish for unknown Indic, or En

        import random
        # Fallback logic
        templates = self.IRRELEVANT_TEMPLATES.get(lang_base, self.IRRELEVANT_TEMPLATES.get("hinglish", self.IRRELEVANT_TEMPLATES["en"]))
        return random.choice(templates)

# Backwards compatibility alias
HinglishProcessor = LanguageProcessor
