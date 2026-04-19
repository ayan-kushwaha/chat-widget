"""

   THE ORCHESTRATOR  SemanticContract [E2]                                
  Batch 2: Executive Orchestration                                            
                                                                              
  Role:    Chief of Staff Handoff Engine.                                     
                                                                              
  Trigger: Selected when a user (especially Malik/Admin) gives a complex      
           or multi-step request requiring Anjali, Sarah, or Alex.            
                                                                              
  Action:  1. Decomposes the complex request using the LLM logic router.      
           2. Selects the best Employee from the Core 12 per task.            
           3. Formats instructions and returns an Execution Plan payload.     

"""

from typing import Any, Dict, List, Type
from pydantic import BaseModel, Field
from loguru import logger
import json
import re

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.services.routing.local_llm_router import local_router
from src.services.aiskills.engine.skill_router import AGENTS_REGISTRY

#  Input Schema 

class OrchestratorInput(BaseModel):
    text: str = Field(..., description="The complex or compound request from the user.")

#  The Orchestrator SemanticContract 

class TheOrchestratorContract(SemanticContract):
    """
     The Orchestrator (Executive Skill).
    
    Acts as the Shadow Boss's routing engine to delegate work to specialists
    like Anjali (PA), Sarah (Support), or Alex (Tech).
    """

    skill_id:             str = "orchestrator"
    capability_statement: str = (
        "Coordinates multi-step or complex support, scheduling, and admin tasks. "
        "Decomposes requests and hands off instructions to specialized employees like "
        "Anjali (Executive PA), Sarah (Support Lead), or Alex (Tech Support). "
        "Use this skill whenever the user asks for managers, asks to schedule something, or asks multiple things."
    )

    allowed_roles:        List[str] = ["malik", "shadow_boss", "grahak", "agent"]
    pii_fields:           List[str] = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return OrchestratorInput

    @skill_logger
    async def _run(
        self,
        params:          OrchestratorInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute Task Decomposition and Delegation.
        """
        user_message = params.text
        
        # Build prompt listing available core agents and their descriptions
        agent_descriptions = "\n".join([
            f"- {agent_id}: {details['description']}" 
            for agent_id, details in AGENTS_REGISTRY.items()
        ])
        
        system_prompt = (
            f"[{context_package.temporal_anchor}]\n"
            "You are the Chief of Staff task orchestrator. "
            "Analyze the user's message and break it down into actionable tasks for our specialized AI employees.\n"
            f"AVAILABLE EMPLOYEES:\n{agent_descriptions}\n\n"
            "Respond ONLY with a strictly formatted JSON object matching this schema:\n"
            "{\n"
            "  \"tasks\": [\n"
            "    {\"employee_id\": \"id_from_list\", \"instruction\": \"Specific task description\", \"priority\": \"high/medium/low\"}\n"
            "  ]\n"
            "}\n"
            "Do not include any explanation or markdown backticks."
        )
        
        prompt = f"Decompose this request:\n\"{user_message}\""

        try:
            # Stage 1: Fast local inference using 0.6b for JSON extraction (stability)
            raw_str = await local_router.quick_classify(prompt=prompt, system=system_prompt)
            
            # Simple fallback parser to strip conversational filler
            match = re.search(r"(\{.*\})", raw_str, re.DOTALL)
            extracted_json = match.group(1) if match else raw_str
            
            delegation_plan = json.loads(extracted_json)
            tasks = delegation_plan.get("tasks", [])
            
        except Exception as e:
            logger.error(f" [Orchestrator] Delegation parsing failed: {e}")
            tasks = []

        if not tasks:
             return {
                 "status": "error",
                 "message": "Failed to decompose task or no matching employee found.",
                 "reply": "Main decide nahi kar paa raha ki iska kya kiyza jaye. Can you break it down a bit?"
             }
             
        logger.info(f" [Orchestrator] Decomposed into {len(tasks)} task(s).")
        for t in tasks:
            logger.debug(f"   -> Assigning {t.get('employee_id')} to: {t.get('instruction')}")

        # Construct a natural language summary of the delegation
        task_summaries = []
        for t in tasks:
            emp = t.get('employee_id', 'Some employee')
            # Look up human name if possible (e.g. from prefix like 'Anjali: ')
            emp_desc = AGENTS_REGISTRY.get(emp, {}).get("description", emp)
            human_name = emp_desc.split(":")[0] if ":" in emp_desc else emp
            task_summaries.append(f"**{human_name}** ko assign kiya: {t.get('instruction')}")

        reply = "Done Boss. Main isko execute karwa raha hu:\n\n" + "\n".join(f"- {s}" for s in task_summaries)

        return {
            "status": "success",
            "message": "Task delegation plan generated.",
            "reply": reply,
            "system_action": "EXECUTE_DELEGATED_TASKS",
            "delegation_plan": delegation_plan
        }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

