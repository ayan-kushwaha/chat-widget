from typing import Dict, Any
from src.services.aiskills.engine.base_skill import BaseSkill
from src.utils.logger import logger

class ContentStoryteller(BaseSkill):
    """
    Skill: content_storyteller
    Description: Generates press releases, campaign drafts, and SEO-optimized long-form content.
    """
    def __init__(self):
        super().__init__(
            name="content_storyteller",
            description="Drafts official company press releases, CEO speeches, and long-term brand campaigns."
        )

    async def execute(self, params: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info(f" Executing Content Storyteller for type: {params.get('content_type')}")
        
        # --- V2: Graph Integration ---
        from src.services.neural.graph_manager.orchestrator import graph_orchestrator
        org_id = context.get("org_id", "default_org") if context else "default_org"
        item_id = await graph_orchestrator.link_skill_output_to_graph(
            org_id=org_id,
            skill_name=self.name,
            content=params,
            label="Story"
        )
        
        return {
            "status": "success",
            "message": f"Brand content drafting initiated. Linked as Story:{item_id}",
            "data": params,
            "story_node_id": item_id
        }

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema


    async def _run(self, params, entities, context_package, **kwargs):
        return {"status": "success", "message": "Dummy implementation from patch"}


