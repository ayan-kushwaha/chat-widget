from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from src.utils.logger import logger

router = APIRouter()

class RefreshRequest(BaseModel):
    org_id: str
    target: str = "all" # "all", "knowledge", "flows"

@router.post("/refresh")
async def refresh_vectors(request: RefreshRequest, background_tasks: BackgroundTasks):
    """
    Webhook for Node.js to trigger a semantic map reload.
    """
    logger.info(f" System Refresh Triggered for Org: {request.org_id} (Target: {request.target})")
    
    # We use BackgroundTasks to not block the Node.js call
    from src.services.ai.ambiguity_engine import AmbiguityEngine
    
    async def run_refresh():
        try:
            engine = AmbiguityEngine(request.org_id)
            await engine.refresh_knowledge_map()
            logger.info(f" Refresh Complete for Org: {request.org_id}")
        except Exception as e:
            logger.error(f" Refresh Task Failed: {e}")

    background_tasks.add_task(run_refresh)
    
    return {"status": "accepted", "message": f"Refresh queued for {request.org_id}"}
