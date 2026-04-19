from typing import Dict, Any, Type, List, Optional
from pydantic import BaseModel, Field
from src.services.aiskills.base_skill import (
    SemanticContract, 
    ContextPackage, 
    EscalationTrigger
)
from src.utils.logger import logger

class ConflictDeescalatorInput(BaseModel):
    user_sentiment: float = Field(..., description="Sentiment score from -1.0 (angry) to 1.0 (happy)")
    last_user_message: str = Field(..., description="The highly emotional message from the user")
    hostility_level: Optional[float] = Field(0.0, description="Inferred hostility level from 0 to 1")

class ConflictDeescalatorContract(SemanticContract):
    """
     X5: Conflict De-escalator  The Empathic Shield.
    Handles heated conversations, prevents churn, and de-escalates hostility.
    """

    capability_statement = """
        I am a specialist in conflict resolution and emotional intelligence. 
        I can detect when a customer is angry, frustrated, or about to churn. 
        I use psychological mirroring and professional empathy to de-escalate 
        the situation, acknowledge legitimate frustrations, and guide the 
        conversation toward a solution or a human supervisor handoff.
        I trigger whenever the user's sentiment becomes highly negative.
    """

    input_schema = ConflictDeescalatorInput
    
    pii_fields = ["last_user_message"]

    escalation_triggers = [
        EscalationTrigger(
            description="User is abusive or hostility exceeds safety threshold",
            condition="hostility_level > 0.8 or 'abuse' in last_user_message.lower()"
        )
    ]

    async def _run(
        self, 
        params: ConflictDeescalatorInput, 
        entities: Dict[str, Any], 
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        
        logger.info(f" [ConflictDeescalator] Dealing with sentiment: {params.user_sentiment}")

        # 1. Read Business DNA for Tone & Identity
        tone_pref = context_package.business_dna.language_preference
        industry = context_package.business_dna.industry_cluster
        
        # 2. Extract specific "Angry Customer" policy from KB
        kb_text = context_package.get_kb_summary()
        
        # 3. Decision Logic: Apologize vs Compensate vs Escalate
        strategy = "BASIC_APOLOGY"
        if params.user_sentiment < -0.6:
            strategy = "FORMAL_DEESCALATION"
            
        if "escalate to supervisor" in kb_text.lower():
            strategy = "HUMAN_HANDOFF_OFFER"

        # 4. Craft Mirroring Response (Simulated)
        response_text = "I understand your frustration and I'm here to help."
        if tone_pref == "hinglish":
            response_text = "Hum samajh sakte hain ki aap pareshaan hain. Iske liye hum maafi chahte hain."
        
        if strategy == "HUMAN_HANDOFF_OFFER":
            response_text += " Should I connect you with my supervisor right away?"

        return {
            "status": "DEESCALATED",
            "strategy": strategy,
            "response": response_text,
            "suggested_action": "OFFER_RESOLUTION_LINK" if params.user_sentiment > -0.7 else "NOTIFY_BOSS",
            "metadata": {
                "sentiment_captured": params.user_sentiment,
                "industry_context": industry
            }
        }

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema


    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

