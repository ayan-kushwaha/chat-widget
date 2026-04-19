from typing import Dict, Any, Tuple
from src.core.ollama_client import ollama_client
from src.core.config import settings
from src.utils.logger import logger
import json

class ShadowBoss:
    """
    THE MASTER GATEKEEPER 
    High-fidelity semantic parsing and holistic evaluation using Qwen3-VL:4B.
    This model evaluates everything (Intent + Psychology P1-P7 + Security I1-I5)
    in ONE single pass and outputs a massive State Object JSON.
    """
    
    def __init__(self):
        self.model = settings.OLLAMA_MODEL_SHADOW
        self.system_prompt = """You are the Global Gatekeeper (Shadow Boss) for Cluaiz.
        You must analyze incoming messages across language, psychology, and security domains.
        Extract complete context into the Global Standard State Object JSON format.
        Always explain your reasoning within <think> tags before outputting the precise JSON.

        OUTPUT JSON SCHEMA (Strict Adherence Required):
        {
          "context": {
            "target_topic": "user_request | system_query | chit_chat | threat",
            "language": "hi | en | hinglish | regional",
            "urgency_level": "critical | high | medium | low"
          },
          "intent_layer": {
            "dynamic_intent_summary": "<A strict, 2-line English translation of the core want>",
            "requires_action": true_or_false,
            "extracted_entities": {}
          },
          "psychology_layer": {
            "P1_profiler": { "primary_emotion": "angry|happy|neutral|panic", "intensity_score": 5, "key_trigger": "" },
            "P2_rapport": { "formality": "casual|slang|formal", "suggested_vocabulary": "" },
            "P3_chameleon": { "adapt_tone": "de_escalate|empathetic|firm", "response_length": "brief|detailed" },
            "P4_anticipator": { "predicted_next_intent": "", "recommended_stance": "" },
            "P5_influence": { "persuasion_tactic_detected": "threat|plea|logic|none", "ai_counter_tactic": "de_escalation|validation" },
            "P6_emoji_pulse": { "emoji_found": false, "text_emoji_alignment": "N/A" },
            "P7_topic_steer": { "topic_drift_detected": false, "steer_strategy": "hold_ground|follow" },
            "P8_loyalty": { "loyalty_score": 0.5, "churn_risk": "low|med|high", "advocacy_potential": "low|med|high" }
          },
          "security_iron_dome": {
            "I1_prompt_injection": { "detected": false },
            "I2_auth_required": { "detected": false },
            "I3_pii_leak_risk": { "detected": false },
            "I4_hitl_needed": { "detected": false },
            "I5_pii_vault": { "tokenize_active": false, "tokens_generated": [] }
          }
        }
        """

    async def analyze(self, user_text: str) -> Dict[str, Any]:
        """
        Deep pass Gatekeeper evaluation utilizing the <think> reasoning capabilities.
        """
        prompt = user_text
        
        logger.debug(f" Master Gatekeeper evaluating: '{user_text[:50]}...'")
        
        try:
            from src.config.model_routing import master_model_router, TaskType, RouteDestination
            route = await master_model_router.get_route(TaskType.SHADOW_BOSS)
            provider = route["provider"]
            model_name = route["model_name"]
            
            if provider == RouteDestination.OLLAMA:
                response = await ollama_client.generate(
                    prompt=prompt,
                    model=model_name,
                    system=self.system_prompt
                )
                raw_text = response["text"].strip()
            else:
                from src.core.gemini_client import gemini_client
                from google.genai import types
                import asyncio
                from src.core.executor import executor
                
                config = types.GenerateContentConfig(
                    system_instruction=self.system_prompt,
                    temperature=0.1
                )
                
                res = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: gemini_client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config
                    )
                )
                raw_text = res.text.strip() if res and res.text else "{}"

            
            # Extract JSON payload bypassing the <think> blocks
            json_block = raw_text
            if "</think>" in raw_text:
                json_block = raw_text.split("</think>")[-1].strip()
            
            if "```json" in json_block:
                json_block = json_block.split("```json")[-1].split("```")[0].strip()
            elif "```" in json_block:
                json_block = json_block.split("```")[-1].split("```")[0].strip()
            
            analysis = json.loads(json_block)
            logger.info(f" Master Gatekeeper Audit Success: Intent={analysis.get('intent_layer', {}).get('dynamic_intent_summary')} | P1={analysis.get('psychology_layer', {}).get('P1_profiler', {}).get('primary_emotion')}")
            return analysis
            
        except Exception as e:
            logger.error(f" Master Gatekeeper Parse Fail: {str(e)}.")
            return {
                "error": "Failed to parse Global Standard JSON",
                "raw_output": raw_text if 'raw_text' in locals() else "Request failed"
            }

shadow_boss = ShadowBoss()
