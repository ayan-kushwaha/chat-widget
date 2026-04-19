from typing import Dict, Any, Optional

class BasePhase:
    """
    Abstract Base Class for all 19 Brain Phases.
    Enforces a standard structure for the 'Router' to understand.
    """
    
    # Metadata for the Router (Vector Search)
    PHASE_ID: str = "base_phase"
    PHASE_NAME: str = "Base Phase"
    PHASE_DESCRIPTION: str = "Abstract base class."
    
    @classmethod
    def get_intent_card(cls) -> str:
        """
        Returns the 'Description Embedding' for the Router.
        This text is what the semantic search matches against.
        """
        return f"{cls.PHASE_NAME}: {cls.PHASE_DESCRIPTION}"

    @staticmethod
    def validate_entry(user_input: str, context: Dict[str, Any]) -> bool:
        """
        Optional: Pre-check if this phase allows entry based on context.
        e.g., Booking Phase checks if 'auth_token' exists.
        """
        return True

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        """
        MAIN LOGIC: Returns the system instruction for this specific phase.
        Must be overridden by child classes.
        """
        raise NotImplementedError("Each phase must implement get_prompt()")

    @staticmethod
    def inject_global_context(system_prompt: str, context: Dict[str, Any]) -> str:
        """
        Helper to inject standard headers (User Name, Time, Role) into any prompt.
        """
        user_name = context.get("user_name", "Guest")
        business_name = context.get("org_name", "Cluaiz")
        
        # --- BRAIN STUDIO CONFIG INJECTION ---
        # 1. Personality Tab
        personality = context.get("personality_config", {})
        tone = personality.get("tone", "Professional & Helpful")
        style = personality.get("style", "Concise")
        
        # 2. Behavior & Goals Tab
        goals = context.get("business_goals", [])
        goal_text = "\n- ".join(goals) if goals else "Help the user."
        
        header = f"""
        RUNNING CONTEXT:
        - User: {user_name}
        - Organization: {business_name}
        - Current Phase: {context.get('current_phase', 'Unknown')}
        
        DYNAMIC PERSONALITY (From Dashboard):
        - Tone: {tone}
        - Style: {style}
        
        ACTIVE BUSINESS GOALS:
        - {goal_text}
        
        AMBIGUITY INSIGHT (Strategy):
        - {context.get('ambiguity_insight', 'None')}
        """
        return header + "\n" + system_prompt
