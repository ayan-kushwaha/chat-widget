from src.core.brain import brain
from src.utils.logger import logger
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re

class SummarizerService:
    def build_analysis_prompt(self, history: list) -> str:
        conversation = ""
        for msg in history:
            role = "User" if msg.get("role") == "user" else "AI"
            content = msg.get("content", "")
            conversation += f"{role}: {content}\n"
            
        return f"""
You are analyzing a chat conversation between a user and an AI assistant. Extract the following information in JSON format:

{{
    "summary": "Brief 1-2 sentence summary of the conversation",
    "sentiment": "positive | neutral | negative",
    "intent": "What was the user trying to achieve? (e.g., 'Get Support', 'Learn About Product', 'Complain')",
    "lead_potential": <0-100>,
    "knowledge_gaps": ["Question 1 that AI couldn't answer well", "Question 2", ...],
    "contact_info": {{
        "name": "extracted name or null",
        "email": "extracted email or null",
        "phone": "extracted phone or null"
    }},
    "key_topics": ["topic1", "topic2", "topic3"]
}}

CONVERSATION:
{conversation}

Respond ONLY with valid JSON. No extra text.
""".strip()

    async def analyze_session(self, history: list):
        try:
            logger.info(" Analyzing Chat Session...")
            prompt = self.build_analysis_prompt(history)
            
            llm = brain.get_llm()
            # Send as user message ?? Or System + User? 
            # Simple approach: user message containing the whole instruction.
            messages = [HumanMessage(content=prompt)]
            
            response = llm.invoke(messages)
            text = response.content
            
            # Extract JSON
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                try:
                    analysis = json.loads(json_match.group(0))
                    logger.info(" Chat Analysis Complete")
                    return analysis
                except json.JSONDecodeError:
                    logger.error(" Failed to parse JSON from AI response")
                    return None
            else:
                logger.warning(" No JSON found in AI response")
                return None
                
        except Exception as e:
            logger.error(f" Summarization Failed: {str(e)}")
            return None

summarizer_service = SummarizerService()
