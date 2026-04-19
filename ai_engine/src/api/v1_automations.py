from fastapi import APIRouter
from pydantic import BaseModel
# Updated Import path
from src.integrations.registry import registry
from src.core.executor import executor

class ToolRequest(BaseModel):
    tool_name: str
    params: dict
    user_id: str

router = APIRouter()

@router.get("/list")
async def list_automations():
    """
    For Mobile App: Returns the 'Menu' of available tools.
    React Native uses this to build the UI dynamically.
    """
    schemas = registry.get_all_schemas()
    return {"count": len(schemas), "tools": schemas}


@router.post("/execute")
async def execute_tool(request: ToolRequest):
    """
    For Mobile App: Executes the action when User taps a button.
    """
    result = await executor.run_tool(request.tool_name, request.params, request.user_id)
    return result

class SummaryRequest(BaseModel):
    history: list

@router.post("/summarize")
async def summarize_chat(request: SummaryRequest):
    """
    Analyzes chat history to extract insights, sentiment, and leads.
    """
    from src.services.automation.summarizer import summarizer_service
    result = await summarizer_service.analyze_session(request.history)
    return result or {"error": "Analysis failed"}
