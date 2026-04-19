from typing import Dict, Any
from src.services.aiskills.engine.base_skill import BaseSkill
from src.utils.logger import logger

class ContextualProbe(BaseSkill):
    """
    Skill: contextual_probe
    Description: Need-Based Questioning (Catching loops).
    """
    def __init__(self):
        super().__init__(
            name="contextual_probe",
            description="Politely asks the user for missing data piece-by-piece to avoid hitting them with a massive form."
        )

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info(f" Executing Contextual Probe for missing point: {params.get('missing_data_point')}")
        return {
            "status": "success",
            "message": "Probe injected into conversation naturally.",
            "data": params
        }

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema


    async def _run(self, params, entities, context_package, **kwargs):
        return {"status": "success", "message": "Dummy implementation from patch"}


