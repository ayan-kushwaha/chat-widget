from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any, AsyncGenerator
from src.services.communication.chat_service import chat_service
from src.utils.logger import logger


#  SSE Adapter 
# Converts the existing NDJSON generator to proper Server-Sent Events format.
# SSE Frame Format: "data: {json_string}\n\n"
# This allows browsers & JS widgets to natively use EventSource or fetch + ReadableStream.
async def sse_adapter(ndjson_gen: AsyncGenerator[str, None]) -> AsyncGenerator[str, None]:
    """
    Wraps any NDJSON generator and re-emits each chunk as a proper SSE frame.
    Also emits a heartbeat ':ping\n\n' comment every ~25 chunks to keep
    connection alive through proxies/load balancers that close idle streams.

    SSE Frame Structure:
        data: {"status": "thinking", "message": " Scanning knowledge base..."}
        (blank line)
    """
    chunk_count = 0
    try:
        async for ndjson_line in ndjson_gen:
            # Strip the trailing \n from NDJSON before wrapping
            clean_line = ndjson_line.strip()
            if clean_line:
                yield f"data: {clean_line}\n\n"
                chunk_count += 1

                # Heartbeat every 25 chunks (keeps proxy connections alive)
                if chunk_count % 25 == 0:
                    yield ": ping\n\n"

        #  Signal clean stream end 
        yield "data: {\"status\": \"done\"}\n\n"

    except Exception as e:
        logger.error(f" [SSE Adapter] Stream error: {e}")
        yield f'data: {{"status": "error", "message": "{str(e)}"}}'  + "\n\n"

class ChatRequest(BaseModel):
    query: str
    user_id: str
    history: List[Dict[str, Any]] = []  # [{"role": "user", "content": "..."}]
    system_instruction: Optional[str] = None
    rag_config: Optional[Dict[str, Any]] = None  # {"filters": {...}, "active_sources": []}
    model_preference: str = "auto"  # "auto", "groq", "ollama"
    config: Optional[Dict[str, Any]] = None # persona, behavior
    selected_source_id: Optional[str] = None # To force context from a button click
    reply_to_mongo_id: Optional[str] = None # UI-driven Deterministic Context Link
    screen_context: Optional[Dict[str, Any]] = None #  SKILL 13: Live page context from widget
    org_id: Optional[str] = None # Org context for multi-tenant routing

class ReactionRequest(BaseModel):
    user_id: str
    target_mongo_id: str
    emoji: str
    org_id: Optional[str] = None # Multi-tenant graph routing

class SearchRequest(BaseModel):
    query: str
    org_id: str
    n_results: Optional[int] = 15

router = APIRouter()


#  Legacy: NDJSON Endpoint (Keep for backward compatibility) 
@router.post("/completions")
async def chat_completions(request: ChatRequest):
    """
    Legacy streaming endpoint (NDJSON format).
    Emits newline-delimited JSON chunks. Kept for backward compatibility.
    """
    generator = chat_service.chat_completion(
        query=request.query,
        user_id=request.user_id,
        history=request.history,
        system_instruction=request.system_instruction,
        rag_config=request.rag_config,
        model_preference=request.model_preference,
        config=request.config,
        selected_source_id=request.selected_source_id,
        screen_context=request.screen_context,
        reply_to_mongo_id=request.reply_to_mongo_id
    )
    return StreamingResponse(generator, media_type="application/x-ndjson")


#  NEW: SSE Endpoint (Preferred for Frontend Widget) 
@router.post("/completions/sse")
async def chat_completions_sse(request: ChatRequest):
    """
     The Thinking... SSE Endpoint (Server-Sent Events).

    Emits proper `data: {...}\n\n` frames that the Cluaiz JS Widget
    can consume via the native browser `EventSource` API or fetch + ReadableStream.

    Event types emitted by the underlying chat_service generator:
        - {status: 'thinking',          message: ' Shadow Boss scanning...'}
        - {status: 'shadow_boss_scan',  data: {psychology JSON}}
        - {status: 'thinking',          message: ' Scanning knowledge base...'}
        - {status: 'thinking',          message: ' Verifying facts...'}
        - {status: 'thinking',          message: ' Drafting response...'}
        - {status: 'stream',            token: '<chunk>'}           per-token
        - {status: 'final',             response: '<full text>'}    completion
        - {status: 'error',             message: '<error text>'}
        - {status: 'done'}                                          stream closed

    Required Headers (returned automatically by StreamingResponse):
        Content-Type:      text/event-stream
        Cache-Control:     no-cache
        X-Accel-Buffering: no    disables Nginx proxy buffering
    """
    ndjson_gen = chat_service.chat_completion(
        query=request.query,
        user_id=request.user_id,
        history=request.history,
        system_instruction=request.system_instruction,
        rag_config=request.rag_config,
        model_preference=request.model_preference,
        config=request.config,
        selected_source_id=request.selected_source_id,
        screen_context=request.screen_context,
        reply_to_mongo_id=request.reply_to_mongo_id
    )
    return StreamingResponse(
        sse_adapter(ndjson_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disables Nginx / reverse-proxy buffering
            "Connection": "keep-alive",
        }
    )

@router.post("/search")
async def global_search(request: SearchRequest):
    """
    Semantic Search across indexed chat history.
    """
    from src.services.ai.search_service import search_service
    results = await search_service.global_search(
        query=request.query,
        org_id=request.org_id,
        n_results=request.n_results
    )
    return {"status": "success", "results": results}

@router.post("/index")
async def index_message(request: Dict[str, Any]):
    """
    Index a single message manually.
    Expects: {org_id, chat_id, message_id, content, metadata}
    """
    from src.services.ai.search_service import search_service
    success = await search_service.index_message(
        org_id=request.get("org_id"),
        chat_id=request.get("chat_id"),
        message_id=request.get("message_id"),
        content=request.get("content"),
        metadata=request.get("metadata", {})
    )
    return {"status": "success" if success else "failed"}

@router.post("/delete")
async def delete_search_index(request: Dict[str, Any]):
    """
    Remove a message from vector index.
    Expects: {org_id, message_id}
    """
    from src.services.ai.search_service import search_service
    success = await search_service.delete_message(
        org_id=request.get("org_id"),
        message_id=request.get("message_id")
    )
    return {"status": "success" if success else "failed"}

@router.post("/reaction")
async def process_emoji_reaction(request: ReactionRequest):
    """
     Handles emoji reactions from the UI.
    Directly connects to Neural Graph Orchestrator for Hebbian weight updates.
    """
    from src.services.neural.graph_manager.orchestrator import graph_orchestrator
    success = await graph_orchestrator.process_reaction(
        user_id=request.user_id,
        target_mongo_id=request.target_mongo_id,
        emoji=request.emoji
    )
    return {"status": "success" if success else "failed"}
