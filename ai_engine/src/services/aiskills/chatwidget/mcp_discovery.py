from typing import Dict, Any, Optional, Type
from pydantic import BaseModel, Field
from loguru import logger
import json

from src.services.aiskills.engine.base_skill import SemanticContract
from src.services.aiskills.types import ContextPackage

class MCPDiscoveryInput(BaseModel):
    action_type: str = Field(
        ..., 
        description="The MCP action to perform: 'fetch_manifest', 'sync_state', or 'execute_tool'"
    )
    target_url: Optional[str] = Field(
        default=None, 
        description="The URL of the page to fetch the MCP manifest for."
    )
    tool_name: Optional[str] = Field(
        default=None, 
        description="The specific MCP tool to execute natively."
    )
    tool_args: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Arguments to pass to the MCP tool."
    )

class MCPDiscoveryContract(SemanticContract):
    """
     MCP Discovery Engine (The 2026 Future Standard)
    Instead of relying on brittle ID/Class scraping, this skill interacts with
    a website's native `window.CLUAIZ_MCP_TOOLS` object to fetch available tools,
    track real-time state, and execute functions declaratively.
    """

    @property
    def capability_statement(self) -> str:
        return (
            "I act as a bridge between the AI and the host website's native functions. "
            "I can fetch the site's MCP Manifest (available tools/actions), read its live state "
            "without relying on blind ID scraping, and execute backend-defined JavaScript tools. "
            "Use me when the website supports Cluaiz MCP schemas for ultra-fast, hallucination-free actions."
        )

    @property
    def input_schema(self) -> Type[BaseModel]:
        return MCPDiscoveryInput

    async def _run(
        self,
        params: MCPDiscoveryInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        
        action = params.action_type.lower()
        org_id = context_package.business_dna.org_id if context_package and context_package.business_dna else "unknown"

        # 1. Fetch Manifest
        if action == "fetch_manifest":
            logger.info(f" [MCP Discovery] Fetching tool manifest for {params.target_url}")
            # In a real scenario, this queries the DB for the pre-crawled Site Action Map
            return {
                "ui_action": {
                    "action": "mcp_handshake",
                    "data": {
                        "mode": "discover",
                        "url": params.target_url
                    }
                },
                "thought": "Initiating a handshake with the website to discover native tools via the MCP bridge."
            }
            
        # 2. Sync State (Live Watcher)
        elif action == "sync_state":
            logger.info(f" [MCP Discovery] Requesting live state sync via MutationObserver hook.")
            return {
                "ui_action": {
                    "action": "mcp_sync_state",
                    "data": {}
                },
                "thought": "Pinging the website's native state watcher to get instant UI updates without a manual re-scan."
            }
            
        # 3. Execute Native Tool
        elif action == "execute_tool":
            if not params.tool_name:
                return {"status": "error", "message": "Tool name is required for execute_tool."}
                
            logger.info(f" [MCP Discovery] Dispatching native action '{params.tool_name}' with args {params.tool_args}")
            return {
                "ui_action": {
                    "action": "mcp_execute_tool",
                    "data": {
                        "toolName": params.tool_name,
                        "args": params.tool_args
                    }
                },
                "thought": f"Executing the native website tool '{params.tool_name}' bypassing normal DOM scraping."
            }

        return {"status": "error", "message": "Unknown action_type."}
