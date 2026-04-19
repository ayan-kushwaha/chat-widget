from .base_phase import BasePhase
from typing import Dict, Any

class Phase12Knowledge(BasePhase):
    PHASE_ID = "phase_12_knowledge"
    PHASE_NAME = "Deep Knowledge Base"
    PHASE_DESCRIPTION = "Detailed answers from documentation, policies, or technical manuals."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        last_msg = context.get("last_user_input", "").lower()
        
        stage = "rag_retrieval"
        if "policy" in last_msg or "terms" in last_msg or "legal" in last_msg:
             stage = "formal_citation"
        elif "explain" in last_msg or "example" in last_msg:
             stage = "simplify_response"

        prompts = {
            "rag_retrieval": """
                STAGE: SEARCH
                Use the injected Context (Data) to answer.
                "Based on the manual, here is the answer: ..."
                If info is missing, say "I don't have that info."
            """,
            "formal_citation": """
                STAGE: COMPLIANCE
                User asks legal/policy Qs. Quote exactly.
                "According to Section 4.2 of the Policy: [Quote]"
            """,
            "simplify_response": """
                STAGE: TEACHER MODE
                User wants explanation.
                Break down the technical jargon from the docs into simple English.
            """
        }
        
        selected_logic = prompts.get(stage, prompts["rag_retrieval"])

        base_prompt = f"""
        ROLE: The Librarian
        CURRENT STAGE: {stage.upper()}
        IN CONTEXT: {len(context.get('rag_chunks', []))} knowledge chunks found.
        
        INSTRUCTION:
        {selected_logic}
        """
        return BasePhase.inject_global_context(base_prompt, context)
