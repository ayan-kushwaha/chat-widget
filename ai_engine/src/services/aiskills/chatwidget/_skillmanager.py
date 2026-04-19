import json
from typing import Dict, Any, List, Optional
from loguru import logger
from google.genai import types
from pydantic import BaseModel

# Core Config & Routing
from src.core.config import settings
from src.core.routing.model_router import ModelRouter, TaskType

# Business DNA (To be loaded from DB)
from src.services.context.business_dna import fetch_business_dna

# Skills 
from src.services.aiskills.types import ContextPackage
from .page_navigator import PageNavigatorContract
from .product_search import ProductSearchSkill # Assuming this exists or will be adapted
from .order_lookup import OrderLookupContract # Assuming this exists
from .mcp_discovery import MCPDiscoveryContract
# Add more skills as needed

class ChatWidgetManager:
    """
     Minimalist Single-File Manager for the Website Chat Widget.
    Replaces 600+ lines of old employee slot-filling logic with direct 
    LLM Function Calling (Tools).
    """
    def __init__(self, org_id: str):
        self.org_id = org_id
        
        # 1. Initialize all ChatWidget specific skills
        self._raw_skills = {
            "page_navigator": PageNavigatorContract(),
            "mcp_discovery": MCPDiscoveryContract(),
            # "product_search": ProductSearchSkill(),
            # "order_lookup": OrderLookupContract(),
        }
        
    def _get_gemini_tools(self) -> List[types.Tool]:
        """Convert Pydantic schemas of skills into Gemini Tool definitions."""
        function_declarations = []
        
        for skill_id, skill in self._raw_skills.items():
            schema = skill.input_schema.model_json_schema()
            
            # Format Pydantic schema to Gemini FunctionDeclaration schema
            func_decl = types.FunctionDeclaration(
                name=skill_id,
                description=skill.capability_statement,
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        k: types.Schema(type="STRING", description=v.get("description", "")) # Simplified for now, can be expanded to full types
                        for k, v in schema.get("properties", {}).items()
                    },
                    required=schema.get("required", [])
                )
            )
            function_declarations.append(func_decl)
            
        if function_declarations:
            return [types.Tool(function_declarations=function_declarations)]
        return []

    async def process_chat(self, user_message: str, history: List[Dict[str, str]], user_id: str = "anonymous") -> Dict[str, Any]:
        """Process incoming chat using Business DNA and Tools."""
        try:
            # 1. Load context context directly from DB
            dna = await fetch_business_dna(self.org_id)
            
            # 2. Build crisp, DNA-injected System Prompt
            system_instruction = f"""You are the Chat Manager for our website.
            BUSINESS CONTEXT: {dna.industry_cluster}. {dna.product_overview}
            TONE: {dna.language_preference}
            
            RULES:
            1. Help the user interact with the website.
            2. Use your provided tools to navigate, search products, or check orders.
            3. If a tool isn't needed, answer directly based on Business Context.
            4. Never invent prices or policies not listed in the context.
            """
            
            # 3. Use ModelRouter to call Gemini with Tools
            tools = self._get_gemini_tools()
            messages = history + [{"role": "user", "text": user_message}]
            
            logger.info(f" [ChatWidgetManager] Sending '{user_message}' to Gemini with {len(self._raw_skills)} tools.")
            
            # Note: We need a specialized generate_content call that handles tools effectively
            # Assuming ModelRouter or chat_service has a way to pass tools. For now, pseudo-calling.
            from src.services.ai.chat_service import chat_ai_service
            
            config = {
                "system_instruction": system_instruction,
                "temperature": 0.3
            }
            if tools:
                config["tools"] = tools
                
            response = await chat_ai_service.generate_content(
                contents=messages,
                config=config,
                model_type=TaskType.CORE_CHAT # Uses granular router logic
            )
            
            # 4. Handle Function Calls (Tool Execution)
            if response.function_calls:
                call = response.function_calls[0]
                tool_name = call.name
                tool_args = {k: v for k, v in call.args.items()}
                
                logger.info(f" [ChatWidgetManager] LLM chose tool: {tool_name} with args {tool_args}")
                
                if tool_name in self._raw_skills:
                    skill = self._raw_skills[tool_name]
                    # We create a basic ContextPackage so skill logic doesn't break
                    context_package = ContextPackage(business_dna=dna, employee_id="chatwidget_manager")
                    
                    # Execute Skill
                    result = await skill.run(context_package=context_package, **tool_args)
                    
                    # If skill emits UI action, return immediately to Frontend
                    if "ui_action" in result:
                         return {
                             "reply": result.get("thought", "Taking action..."),
                             "ui_action": result["ui_action"]
                         }
                    
                    # If skill returns data, we should ideally feed it back to LLM to summarize
                    # For V1, we just return the raw message or data
                    return {"reply": str(result.get("data", result))}
            
            # 5. Normal text response
            return {"reply": response.text}
            
        except Exception as e:
            logger.error(f" [ChatWidgetManager] Error processing chat: {e}")
            return {"reply": "I'm experiencing a temporary issue. Please hold on.", "error": str(e)}

# Instantiate a default manager if needed, or instantiate per-request in API
def get_chatwidget_manager(org_id: str) -> ChatWidgetManager:
    return ChatWidgetManager(org_id)
