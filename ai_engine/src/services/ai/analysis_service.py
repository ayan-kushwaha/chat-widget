import json
import typing_extensions as typing
from .base import BaseAIService

class ChatAnalysisResult(typing.TypedDict):
    summary_hindi: str
    user_mood: str
    action_required: bool
    action_item: str
    retention_policy: str
    is_garbage: bool
    learning_needed: bool
    missing_topic: str
    tags: list[str]

class AnalysisAIService(BaseAIService):
    """
    Structured analysis service using Gemini 2.0 Flash-Lite.
    Extracts insights from chat transcripts.
    """

    async def analyze_chat(self, chat_transcript: str) -> dict:
        prompt = f"""
You are the "Cluaiz Intelligence Engine". Analyze the provided chat transcript and return strict JSON.
BE STRICT. Do not save garbage messages (Hi, Hello, Greetings) as valuable data.

--- INPUT CHAT ---
{chat_transcript}

--- OUTPUT SCHEMA ---
Return ONLY valid JSON matching ChatAnalysisResult schema.
"""
        config_params = {
            "temperature": 0.0,  # Precise for JSON
            "response_mime_type": "application/json",
            "response_schema": ChatAnalysisResult,
            "max_output_tokens": 2192
        }

        try:
            response = await self.generate_content(prompt, config_params)
            result = json.loads(response.text)
            print(f" AI Analysis Success: {result.get('summary_hindi', 'N/A')}")
            return result
        except Exception as e:
            print(f" AI Analysis Error: {e}")
            return {
                "summary_hindi": "Error analyzing chat.",
                "user_mood": "Neutral",
                "action_required": False,
                "action_item": "",
                "retention_policy": "7_DAY",
                "is_garbage": False,
                "learning_needed": False,
                "missing_topic": "",
                "tags": ["error"]
            }

analysis_ai_service = AnalysisAIService()
