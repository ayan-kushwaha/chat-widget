import json
from typing import Dict, Any, List, Optional
from loguru import logger
from google.genai import types

# Core Config & Routing
from src.core.routing.model_router import ModelRouter, TaskType

# Business DNA (To be loaded from DB)
from src.services.context.business_dna import fetch_business_dna

# Executive Skills
from .report_generator import ReportGeneratorSkill
from .task_summary import TaskSummarySkill
from .leave_manager import LeaveManagerSkill
from .payroll_calculator import PayrollCalculatorSkill
from .briefing_architect import BriefingArchitectContract
from .voice_to_task import VoiceToTaskContract
from .meeting_negotiator import MeetingNegotiatorContract
from .orchestrator import OrchestratorContract
from .handle_frustration import HandleFrustrationContract
from .diagnostic_parser import DiagnosticParserContract
from .context_memory import ContextMemoryContract

class ExecutiveManager:
    """
     Manager for the Executive PA / Boss Dashboard.
    Handles internal business tasks like reports, HR, and scheduling.
    """
    def __init__(self, org_id: str):
        self.org_id = org_id
        
        # Initialize Executive specific skills
        self._raw_skills = {
            # Add instantiated skills here as needed
            # "report_generator": ReportGeneratorSkill(),
            # "leave_manager": LeaveManagerSkill(),
        }
        
    def _get_gemini_tools(self) -> List[types.Tool]:
        """Convert Pydantic schemas of skills into Gemini Tool definitions."""
        function_declarations = []
        for skill_id, skill in self._raw_skills.items():
            if hasattr(skill, "input_schema"):
                schema = skill.input_schema.model_json_schema()
                func_decl = types.FunctionDeclaration(
                    name=skill_id,
                    description=skill.capability_statement if hasattr(skill, "capability_statement") else getattr(skill, "description", ""),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            k: types.Schema(type="STRING", description=v.get("description", ""))
                            for k, v in schema.get("properties", {}).items()
                        },
                        required=schema.get("required", [])
                    )
                )
                function_declarations.append(func_decl)
                
        if function_declarations:
            return [types.Tool(function_declarations=function_declarations)]
        return []

    async def process_command(self, user_message: str, history: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
        """Process commands from the Boss/Admin."""
        try:
            dna = await fetch_business_dna(self.org_id)
            
            system_instruction = f"""You are the Executive PA and Internal Manager.
            BUSINESS CONTEXT: {dna.industry_cluster}. 
            
            RULES:
            1. You assist the business owner (Boss) with internal operations.
            2. Use your tools to generate reports, manage leaves, and summarize tasks.
            3. Maintain a professional, highly efficient administrative tone.
            """
            
            tools = self._get_gemini_tools()
            messages = history + [{"role": "user", "text": user_message}]
            
            from src.services.ai.chat_service import chat_ai_service
            config = {"system_instruction": system_instruction, "temperature": 0.2}
            if tools:
                config["tools"] = tools
                
            response = await chat_ai_service.generate_content(
                contents=messages,
                config=config,
                model_type=TaskType.CORE_CHAT
            )
            
            if response.function_calls:
                # Handle tool execution (similar to chatwidget)
                pass
            
            return {"reply": response.text}
            
        except Exception as e:
            logger.error(f" [ExecutiveManager] Error: {e}")
            return {"reply": "Error executing executive command.", "error": str(e)}

def get_executive_manager(org_id: str) -> ExecutiveManager:
    return ExecutiveManager(org_id)
