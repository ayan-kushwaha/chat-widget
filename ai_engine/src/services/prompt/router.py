from .phases.phase_00_onboarding import Phase00Onboarding
from .phases.phase_01_discovery import Phase01Discovery
from .phases.phase_02_solution import Phase02Solution
from .phases.phase_03_booking import Phase03Booking
from .phases.phase_04_sales import Phase04Sales
from .phases.phase_05_support import Phase05Support
from .phases.phase_06_feedback import Phase06Feedback
from .phases.phase_07_followup import Phase07FollowUp
from .phases.phase_08_objection import Phase08Objection
from .phases.phase_09_closing import Phase09Closing
from .phases.phase_10_referral import Phase10Referral
from .phases.phase_11_account import Phase11Account
from .phases.phase_12_knowledge import Phase12Knowledge
from .phases.phase_13_escalation import Phase13Escalation
from .phases.phase_14_data import Phase14Data
from .phases.phase_15_analysis import Phase15Analysis
from .phases.phase_16_notification import Phase16Notification
from .phases.phase_17_hands import Phase17Hands
from .phases.phase_18_eyes import Phase18Eyes
from .phases.phase_19_reflexes import Phase19Reflexes
from .phases.phase_20_diagnostics import Phase20Diagnostics

# In a real vector search, we would embed descriptions.
# For MVP, we map IDs to Classes.
PHASE_MAP = {
    Phase00Onboarding.PHASE_ID: Phase00Onboarding,
    Phase01Discovery.PHASE_ID: Phase01Discovery,
    Phase02Solution.PHASE_ID: Phase02Solution,
    Phase03Booking.PHASE_ID: Phase03Booking,
    Phase04Sales.PHASE_ID: Phase04Sales,
    Phase05Support.PHASE_ID: Phase05Support,
    Phase06Feedback.PHASE_ID: Phase06Feedback,
    Phase07FollowUp.PHASE_ID: Phase07FollowUp,
    Phase08Objection.PHASE_ID: Phase08Objection,
    Phase09Closing.PHASE_ID: Phase09Closing,
    Phase10Referral.PHASE_ID: Phase10Referral,
    Phase11Account.PHASE_ID: Phase11Account,
    Phase12Knowledge.PHASE_ID: Phase12Knowledge,
    Phase13Escalation.PHASE_ID: Phase13Escalation,
    Phase14Data.PHASE_ID: Phase14Data,
    Phase15Analysis.PHASE_ID: Phase15Analysis,
    Phase16Notification.PHASE_ID: Phase16Notification,
    Phase17Hands.PHASE_ID: Phase17Hands,
    Phase18Eyes.PHASE_ID: Phase18Eyes,
    Phase19Reflexes.PHASE_ID: Phase19Reflexes,
    Phase20Diagnostics.PHASE_ID: Phase20Diagnostics,
    Phase18Eyes.PHASE_ID: Phase18Eyes,
    Phase19Reflexes.PHASE_ID: Phase19Reflexes,
    Phase20Diagnostics.PHASE_ID: Phase20Diagnostics,
}

from .ambiguity_engine import AmbiguityEngine

class BrainRouter:
    """
    THE BRAIN V2 (Semantic Router)
    Decides which Phase (Specialist) should handle the user request.
    """
    
    @staticmethod
    async def route(user_text: str, context: Dict[str, Any]) -> str:
        """
        1. Critical Gate: Guest Access (Phase 00).
        2. Ambiguity Check (V2 Engine).
        3. Keyword Logic (MVP).
        """
        # 0. Global Context Injection (Ensure Phase Memory)
        previous_phase = context.get("current_phase", None)

        # 1. Critical Gate: Guest Access
        # If trying to book without auth -> Phase 00
        user_status = context.get("user_status", "guest")
        if user_status == "guest" and any(w in user_text.lower() for w in ["book", "meeting", "call"]):
            return Phase00Onboarding.PHASE_ID

        # 2. AMBIGUITY ENGINE V2 (The Helper)
        # Checks for "h", "price", vagueness
        ambiguity_result = AmbiguityEngine.resolve_intent(user_text, context)
        if ambiguity_result.get("phase"):
            # If Engine found a smart mapping (e.g. 'h' -> Discovery), use it.
            # Store the 'clarified_instruction' in context for the Phase to read later!
            context["ambiguity_insight"] = ambiguity_result.get("clarified_instruction")
            
            if ambiguity_result["phase"] == "keep_current_phase":
                return previous_phase if previous_phase else Phase01Discovery.PHASE_ID
            
            return ambiguity_result["phase"]

        # 3. Keyword Logic (Simulating Vector Search)
        text = user_text.lower()
        
        if "login" in text or "name" in text:
            return Phase00Onboarding.PHASE_ID
        if "book" in text or "schedule" in text or "time" in text:
            return Phase03Booking.PHASE_ID
        if "price" in text or "cost" in text or "buy" in text or "pay" in text:
            return Phase04Sales.PHASE_ID
        if "expert" in text or "agent" in text or "human" in text:
            return Phase13Escalation.PHASE_ID
        if "bug" in text or "error" in text or "help" in text:
            return Phase05Support.PHASE_ID
        if "rate" in text or "feedback" in text or "bad" in text or "good" in text:
            return Phase06Feedback.PHASE_ID
        if "feature" in text or "what is" in text or "tell me" in text:
            return Phase02Solution.PHASE_ID
        if "policy" in text or "manual" in text or "docs" in text:
            return Phase12Knowledge.PHASE_ID
        if "update" in text or "change" in text or "profile" in text:
            return Phase11Account.PHASE_ID
            
        # Default Fallback -> Discovery
        return Phase01Discovery.PHASE_ID
    
    @staticmethod
    def get_phase_class(phase_id: str):
        return PHASE_MAP.get(phase_id, Phase01Discovery)
