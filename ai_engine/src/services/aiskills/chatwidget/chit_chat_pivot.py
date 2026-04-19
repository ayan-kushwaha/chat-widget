from typing import Dict, Any
from src.services.aiskills.engine.base_skill import BaseSkill
from src.utils.logger import logger

class ChitChatPivot(BaseSkill):
    """
    Skill: chit_chat_pivot
    Description: Soft Topic Steer. Gracefully handles casual 'Hello/How are you' and redirects to business action.
    """
    def __init__(self):
        super().__init__(
            name="chit_chat_pivot",
            description="Engages in brief casual conversation and then steers the user towards a business objective."
        )

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info(f" Executing Chit-Chat Pivot from {params.get('user_topic')} to business.")
        
        return {
            "status": "success",
            "message": "Conversational pivot executed.",
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


