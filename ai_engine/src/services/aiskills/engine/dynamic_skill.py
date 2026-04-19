from typing import Dict, Any, Type
from pydantic import BaseModel, create_model
from .base_skill import BaseSkill
from .dynamic_executor import DynamicExecutor

class DynamicSkill(BaseSkill):
    """
     The Shape-Shifter Skill.
    Adopts its identity, mandates, and logic from the Database at runtime.
    """
    
    def __init__(self, agent_config: Dict[str, Any], skill_id: str):
        # Extract metadata for this specific skill from config
        self.agent_config = agent_config
        self.skill_id = skill_id
        
        # Get skill details from deep_dive_data
        skills_mandates = agent_config.get("dynamic_brain", {}).get("step_2_deep_dive", {}).get("focus_areas", [])
        mandate = next((m for m in skills_mandates if m["skill"] == skill_id), {})
        
        name = skill_id
        description = mandate.get("mandate", f"Executor for {skill_id}")
        
        super().__init__(name=name, description=description)
        self.executor = DynamicExecutor(agent_config)
        
        # Build a dynamic input model if needed (Defaulting to generic text for now)
        self._input_model = create_model(
            f"{skill_id}Input",
            user_input=(str, ...),
            context=(Dict[str, Any], {})
        )

    @property
    def input_model(self) -> Type[BaseModel]:
        return self._input_model

    async def _run(self, params: BaseModel, entities: Dict[str, Any], platform: str, **kwargs) -> Dict[str, Any]:
        """
        Delegates execution to the DynamicExecutor which uses the DB mandates.
        """
        # params is an instance of the dynamic Input model
        user_input = getattr(params, "user_input")
        context = getattr(params, "context", {})
        
        # Merge entities and platform into context for the LLM
        context.update({
            "extracted_entities": entities,
            "detected_platform": platform
        })
        
        result = await self.executor.execute_skill(
            skill_id=self.skill_id,
            user_input=user_input,
            context=context
        )
        
        return result

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

