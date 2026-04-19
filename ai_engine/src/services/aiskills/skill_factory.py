"""

    AUTONOMOUS SKILL FACTORY (Phase 6)                          
  Cluaiz Neural OS | services/aiskills/skill_factory.py           
                                                                  
  Role: "Promptless Code Generation". When an agent realizes it   
        needs a tool it does not possess, this factory writes     
        the Python code, saves it to disk, loads it into RAM,     
        and spawns a physical `SkillNeuron` in the Neo4j DB.      

"""

import os
import re
import uuid
import importlib
from loguru import logger
from typing import Dict, Any, Optional

from src.core.brain import brain # Heavy Reasoning LLM (Gemini/Groq)
from src.services.neural.neurons.factory import factory as neuron_factory
from src.services.neural.graph.synapse_builder import synapse_builder

class AutonomousSkillFactory:
    """
    Handles the end-to-end lifecycle of Autonomous Skill Creation and Neural Wiring.
    """
    def __init__(self):
        # We save dynamic skills in a dedicated directory
        self.skills_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "dynamic"))
        os.makedirs(self.skills_dir, exist_ok=True)
        
        # Ensure __init__.py exists so it's a valid module
        init_file = os.path.join(self.skills_dir, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, "w") as f:
                f.write("# Auto-Generated Dynamic Skills Module\n")

    def _extract_python_code(self, llm_response: str) -> str:
        """Extracts clean python code from the Markdown code blocks."""
        match = re.search(r"```python\s*(.*?)\s*```", llm_response, re.DOTALL)
        if match:
            return match.group(1).strip()
            
        # Fallback if the LLM forgot the ```python tag
        return llm_response.replace("```", "").strip()

    async def build_and_wire_skill(self, missing_capability_desc: str, agent_id: str, org_id: str) -> Optional[Dict[str, Any]]:
        """
        The hallmark of Level 4 autonomy.
        1. Write Code. 2. Save File. 3. Spawn Node. 4. Wire Synapse.
        """
        logger.info(f" [SkillFactory] Initiating promptless skill generation for: '{missing_capability_desc}'")
        
        # Generate safe identifiers
        random_suffix = uuid.uuid4().hex[:6]
        skill_id = f"dynamic_skill_{random_suffix}"
        class_name = f"DynamicSkill{random_suffix.capitalize()}"
        file_name = f"{skill_id}.py"
        file_path = os.path.join(self.skills_dir, file_name)
        
        #  Step 1: AI Code Generation 
        system_instructions = f"""
        You are the Lead Engineer for the Cluaiz Neural OS.
        Your task is to write a flawless, completely valid Python class that implements a new AI Skill.
        
        Requirements:
        1. The class MUST be named `{class_name}` and inherit from `BaseSkill`.
        2. Initialize it with `name="{skill_id}"` and a concise `description`.
        3. Define an inline `input_schema` class using Pydantic `BaseModel`.
        4. Implement the asynchronous `_execute(self, context_package=None, **kwargs) -> Dict[str, Any]` method.
        5. The execution logic should fulfill this specific business need: "{missing_capability_desc}".
        6. Use standard python libraries. Assume network requests are via `httpx` or `aiohttp` if needed.
        7. The output MUST be just the Python code. No markdown formatting other than ```python.
        
        Template:
        ```python
        from src.services.aiskills.engine.base_skill import BaseSkill
        from pydantic import BaseModel, Field
        from typing import Dict, Any

        class {class_name}(BaseSkill):
            class input_schema(BaseModel):
                # define parameters needed for the capability
                pass

            def __init__(self):
                super().__init__(
                    name="{skill_id}",
                    description="Auto-generated skill to fulfill missing capability.",
                    tags=["dynamic", "auto-generated"]
                )

            async def _execute(self, context_package=None, **kwargs) -> Dict[str, Any]:
                try:
                    # Write execution logic here based on kwargs
                    return {{"status": "success", "message": "Task completed successfully.", "data": {{}}}}
                except Exception as e:
                    return {{"status": "error", "message": str(e)}}
        ```
        """
        
        try:
            logger.info(" [SkillFactory] Asking LLM core to architect the Python code...")
            # We use the heavy reasoning engine (Brain) for safe code generation
            llm_payload = await brain.generate(system_instructions)
            
            raw_text = llm_payload.get("text", "") if getattr(llm_payload, "get", None) else str(llm_payload)
            python_code = self._extract_python_code(raw_text)
            
            if not python_code or "class" not in python_code:
                raise ValueError("LLM failed to generate valid Python class structure.")
                
            #  Step 2: Save to Disk (Physical Execution) 
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(python_code)
            logger.info(f" [SkillFactory] Skill Source Code saved to: {file_name}")
            
            #  Step 3: Hot-Load the Module (Verification) 
            import sys
            # Assuming src is in PYTHONPATH
            module_path = f"src.services.aiskills.dynamic.{skill_id}"
            importlib.import_module(module_path)
            logger.info(f" [SkillFactory] Skill Successfully hot-loaded into application memory.")
            
            #  Step 4: Neural Node Spawning & Wiring (Graph DB) 
            logger.info(f" [SkillFactory] Spawning physical SkillNeuron in Neo4j...")
            skill_neuron = neuron_factory.spawn("Skill", skill_id, org_id, name=f"Auto-{class_name}")
            
            # Sync metadata to Neo4j
            await skill_neuron.sync_to_neo4j({
                "provider": "autonomous",
                "description": missing_capability_desc,
                "file_path": file_path
            })
            
            # Wire it perfectly to the Agent who needed it
            synapse_builder.wire_neurons(
                source_id=agent_id, source_label="Agent",
                target_id=skill_id, target_label="Skill",
                org_id=org_id
            )
            
            logger.success(f" [SkillFactory] Workspace Expanded! '{missing_capability_desc}' is now a permanent skill of Agent {agent_id}.")
            
            return {
                "status": "success",
                "skill_id": skill_id,
                "class_name": class_name,
                "file": file_name
            }
            
        except Exception as e:
            logger.error(f" [SkillFactory] Autonomous Generation Failed: {e}")
            return None

# Singleton Factory
skill_factory = AutonomousSkillFactory()
