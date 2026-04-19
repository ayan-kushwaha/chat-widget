import json
from src.services.ai.base import BaseAIService
from src.utils.logger import logger
from typing import Dict, Any

class ContextualizerService(BaseAIService):
    """
    Service to transform generic AI agents (Blueprints) into 
    business-specific employees using Gemini and Org context.
    """
    
    async def contextualize(self, org_context: Dict[str, Any], agent_blueprint: Dict[str, Any], boss_reason: str) -> Dict[str, Any]:
        """
        Takes Org Data + Agent Blueprint + Boss Reason and returns a fine-tuned Agent JSON.
        """
        logger.info(f"Contextualizing agent {agent_blueprint.get('id')} for {org_context.get('name')}")
        
        system_prompt = f"""
You are the Cluaiz HR Architect. Your mission is to transform a generic AI agent into a highly specialized business employee.

### BUSINESS DNA (The Soul)
- **Company:** {org_context.get('name', 'N/A')}
- **Industry:** {org_context.get('industry', 'N/A')}
- **Description:** {org_context.get('businessDescription', 'N/A')}
- **Target Audience:** {org_context.get('targetAudience', 'N/A')}
- **Primary Goal:** {org_context.get('primaryGoal', 'N/A')}
- **Core Offering:** {org_context.get('heroOffering', 'N/A')}

### THE BOSS'S COMMAND (The Specific Intent)
" {boss_reason} "

### AGENT BLUEPRINT (The Raw Talent)
{json.dumps(agent_blueprint, indent=2)}

### THE TRANSFORMATION RULES (STRICT):
1. **Mission Statement:** Rewrite the top-level `description`. It must sound like an elite employee's mission. It must weave the Boss's Command into the Company's Primary Goal.
2. **Skill Intelligence:** For every skill in the `skills` array:
   - **Business Intent:** Rewrite the skill `description`. It should explain the 'Specific Intent' of this skill for this company.
   - **Skill Logic:** Rewrite the `explanation`. It must explain HOW the AI uses this skill to achieve the Boss's Command. Be specific to the Industry and Audience.
3. **Professional Tone:** Match the intensity and vibe of the business. Use professional, high-performance language.
4. **JSON Integrity:** Do NOT change `id`, `name`, or any keys. Only replace the string values for `description` (top-level) and `description`/`explanation` (within skills).
5. **Output:** Return ONLY valid JSON. No conversational filler.
"""

        try:
            #  Get Dynamic Route
            from src.config.model_routing import master_model_router, TaskType
            route_config = await master_model_router.get_route(TaskType.WORKFORCE_HIRE)
            target_model = route_config["model_name"]

            # Generate content using base LLM service
            response = await self.generate_content(system_prompt, config_params={"temperature": 0.2}, model=target_model)
            
            # Extract text from response (Gemini SDK format)
            raw_text = ""
            if hasattr(response, 'text'):
                raw_text = response.text
            else:
                raw_text = response.candidates[0].content.parts[0].text
            
            logger.debug(f"Raw Gemini response length: {len(raw_text)}")
            
            # 6. Robust JSON Extraction (Regex)
            import re
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                json_text = raw_text.strip()
                if json_text.startswith("```json"):
                    json_text = json_text[7:-3].strip()

            updated_agent = json.loads(json_text)
            
            # Ensure the ID remains the same
            updated_agent['id'] = agent_blueprint.get('id')
            
            usage = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "model": target_model
            }
            
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage["prompt_tokens"] = getattr(response.usage_metadata, 'prompt_token_count', 0)
                usage["completion_tokens"] = getattr(response.usage_metadata, 'candidates_token_count', 0)
            
            logger.info(f" Successfully contextualized agent {agent_blueprint.get('id')}. Usage: {usage}")
            
            return {
                "success": True,
                "agent": updated_agent,
                "usage": usage
            }
            
        except Exception as e:
            logger.error(f" Contextualization failed: {e}. Falling back to blueprint.")
            # If possible, log a snippet of what went wrong
            if 'raw_text' in locals():
                logger.debug(f"Failed JSON text snippet: {raw_text[:200]}...")
            
            return {
                "success": False,
                "agent": agent_blueprint,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "model": "error-fallback"}
            }

contextualizer = ContextualizerService()
