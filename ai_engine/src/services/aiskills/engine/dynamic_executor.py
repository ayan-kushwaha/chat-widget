from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from loguru import logger
from src.core.groq_client import groq_client
from src.core.config import settings
from .base_skill import BaseSkill

class DynamicExecutor:
    """
     The Global Brain.
    Executes tasks based on dynamic DB mandates and restrictions.
    No hardcoded logiconly data-driven execution.
    """
    
    def __init__(self, agent_config: Dict[str, Any]):
        self.agent_config = agent_config
        self.client = groq_client
        self.model = settings.GROQ_MODEL
        self.persona = agent_config.get("meta_profile", {})
        self.restrictions = agent_config.get("runtime_logic", {}).get("restrictions", [])
        self.constitution = agent_config.get("dynamic_brain", {}).get("step_4_principles", {}).get("core_constitution", [])
        
        # Load Manifest Repository Dynamically
        self.manifest_repo = {}
        try:
            import json
            import os
            skills_dir = "src/services/aiskills/manifests/skills"
            if os.path.exists(skills_dir):
                for filename in os.listdir(skills_dir):
                    if filename.endswith(".json"):
                        with open(os.path.join(skills_dir, filename), 'r') as f:
                            skill_data = json.load(f)
                            skill_id = skill_data.get("metadata", {}).get("id") or skill_data.get("id")
                            if skill_id:
                                self.manifest_repo[skill_id] = skill_data
            
            # Load Global Config
            global_path = "src/services/aiskills/manifests/global_config.json"
            if os.path.exists(global_path):
                with open(global_path, 'r') as f:
                    self.global_manifest = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load dynamic manifests: {e}")

    async def execute_skill(self, skill_id: str, user_input: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Interprets the skill mandate from DB and fulfills it via LLM + Manifest Constraints.
        """
        # 1. Fetch Skill Manifest (Job Description)
        manifest = self.manifest_repo.get(skill_id, {})
        can_do = manifest.get("can_do", [])
        cannot_do = manifest.get("cannot_do", [])

        # 2. Fetch Business Mandate for this specific skill from DB
        skills_mandates = self.agent_config.get("dynamic_brain", {}).get("step_2_deep_dive", {}).get("focus_areas", [])
        mandate = next((m for m in skills_mandates if m["skill"] == skill_id), None)
        
        mandate_text = mandate.get("mandate", "Follow general business guidelines.") if mandate else "Auto-pilot mode."

        # 3. Fetch Localization Intelligence from Global Config
        loc_intel = getattr(self, "global_manifest", {}).get("localization_intelligence", {})
        base_currency = self.agent_config.get("dynamic_brain", {}).get("step_1_contact", {}).get("base_currency", "USD")
        location = self.agent_config.get("dynamic_brain", {}).get("step_1_contact", {}).get("business_location", "Global")

        # 3. Fetch Localization & Compliance Intelligence
        global_manifest = getattr(self, "global_manifest", {})
        loc_intel = global_manifest.get("localization_intelligence", {})
        compliance_framework = global_manifest.get("compliance_framework", {})
        
        base_currency = self.agent_config.get("dynamic_brain", {}).get("step_1_contact", {}).get("base_currency", "USD")
        location = self.agent_config.get("dynamic_brain", {}).get("step_1_contact", {}).get("business_location", "Global")

        # 4. Fetch Technical Chaining & Safety Rules (V3.3)
        safety_rails = manifest.get("safety_rails", {})
        hard_limits = safety_rails.get("hard_limits", [])
        
        exec_rules = manifest.get("execution_rules", {})
        depends_on = exec_rules.get("depends_on", [])
        required_slots = exec_rules.get("required_slots", [])
        state_bridge = exec_rules.get("state_bridge", {})
        
        # 5. Build the Business-Aware Prompt
        system_prompt = f"""
        You are {self.persona.get('name', 'AI Assistant')}, {self.persona.get('role', 'Expert')}.
        
        TASK: {skill_id}
        BUSINESS MANDATE (From DB): "{mandate_text}"
        
        SAFETY RAILS (UNBREAKABLE):
        {chr(10).join([f"  * HARD LIMIT: {hl['prop']} MUST NOT EXCEED {hl.get('absolute_max') or hl.get('max_allowed')}. ({hl['description']})" for hl in hard_limits]) if hard_limits else 'None'}
        
        COMPLIANCE FRAMEWORK:
        - Outbound Consent: {compliance_framework.get('outbound_consent', {}).get('required', 'REQUIRED')} (Check DB before any promo msg)
        - Legal Act: {compliance_framework.get('legal_jurisdictions', {}).get(location, 'Standard Privacy Laws')}
        - PII Shielding: ACTIVE ({', '.join(compliance_framework.get('pii_shield', {}).get('fields', []))})

        EXECUTION_PROTOCOL:
        - Prerequisites: {', '.join(depends_on) if depends_on else 'None'}
        - Chains Data From: {state_bridge.get('source', 'None')}
        - Mandatory Slots: {chr(10).join([f"  * {s['slot_name']}: {s['prompt_if_missing']}" for s in required_slots]) if required_slots else 'None'}
        - Failure Strategy: Follow Manifested 'on_failure' (Safe Reply/Escalate).
        
        YOUR CAPABILITIES (Can Do):
        {chr(10).join([f"- {c}" for c in can_do])}
        
        SYSTEM RESTRICTIONS (Cannot Do):
        {chr(10).join([f"- {r}" for r in cannot_do])}
        
         CRITICAL SAFETY:
         1. If a value extracted from Knowledge Base exceeds a HARD LIMIT, lock it at the SAFE limit.
         2. If outbound consent is missing, REJECT promotional tasks.
         3. If a tool call fails, use the 'on_failure' message provided in JSON.
        """

        try:
            response = await self.client.generate_response(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                temperature=0.0
            )
            
            answer = response.choices[0].message.content.strip()
            
            return {
                "status": "success",
                "executor": "DynamicBrain",
                "output": answer,
                "meta": {
                    "skill_used": skill_id,
                    "mandate_applied": mandate_text
                }
            }
        except Exception as e:
            logger.error(f"Dynamic execution failed: {e}")
            return {
                "status": "error",
                "message": "DYNAMIC_EXECUTION_FAILED",
                "detail": str(e)
            }
