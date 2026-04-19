"""

    THE PROFILER  SemanticContract [P1]                                     
  Pillar H (Heart  Sarah)                                                    
                                                                              
  Role:    The Core Behavioral Ledger.                                        
  Action:  Maintains a psychological profile of the user in MongoDB.          
           Tracks interaction history, preferred language, formality,         
           and business-specific trust/value scores.                          
                                                                              
  Why:     Without Memory, AI is just a chatbot. The Profiler gives Cluaiz    
           long-term EQ persistence.                                          

"""

from typing import Dict, Any, List, Type, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage
from src.core.mongodb import mongo_db_client

#  Schema 

class ProfilerInput(BaseModel):
    user_id: str = Field(..., description="Unique ID of the user (phone or hash)")
    business_id: str = Field(..., description="Business context ID")
    extracted_traits: Dict[str, Any] = Field(
        default_factory=dict,
        description="Newly extracted EQ traits from the current message (e.g., tone, language)"
    )

class UserPersonaProfile(BaseModel):
    user_id: str
    business_id: str
    last_interaction: datetime
    interaction_count: int = 0
    language_preference: str = "english"
    tone_preference: str = "neutral"
    formality_level: str = "formal"
    trust_score: float = 0.5  # 0.0 (angry/distrust) to 1.0 (loyal)
    custom_tags: List[str] = Field(default_factory=list)

#  Contract 

class TheProfilerContract(SemanticContract):
    skill_id: str = "the_profiler"
    capability_statement: str = "Maintains and updates the long-term psychological and behavioral profile of the user in MongoDB."
    
    allowed_roles: List[str] = ["malik", "grahak", "agent", "shadow_boss"]
    pii_fields: List[str] = ["user_id"]
    
    COLLECTION_NAME = "user_personas"

    @property
    def input_schema(self) -> Type[BaseModel]:
        return ProfilerInput

    async def _collection(self):
        db = await mongo_db_client.get_db()
        return db[self.COLLECTION_NAME] if db is not None else None

    @skill_logger
    async def _run(
        self,
        params: ProfilerInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Fetches the existing profile, updates it with new traits, and saves it.
        """
        user_id = params.user_id
        business_id = params.business_id
        new_traits = params.extracted_traits

        col = await self._collection()
        
        # 1. Fetch Existing
        profile_dict = None
        if col is not None:
             profile_dict = await col.find_one({"user_id": user_id, "business_id": business_id})
        
        if not profile_dict:
             profile = UserPersonaProfile(
                 user_id=user_id,
                 business_id=business_id,
                 last_interaction=datetime.utcnow()
             )
        else:
             profile = UserPersonaProfile(**profile_dict)
             
        # 2. Update Profile State
        profile.interaction_count += 1
        profile.last_interaction = datetime.utcnow()
        
        if "language" in new_traits:
            profile.language_preference = new_traits["language"]
        if "tone" in new_traits:
            profile.tone_preference = new_traits["tone"]
        if "formality" in new_traits:
            profile.formality_level = new_traits["formality"]
            
        # Optional: Adjust trust score slightly based on sentiment if provided
        sentiment = new_traits.get("sentiment_score", 0.0)
        if sentiment:
            # Shift trust towards the sentiment slowly 
            alpha = 0.1 # Learning rate
            # Map sentiment [-1, 1] to trust scale [0, 1] roughly: sentiment/2 + 0.5
            target_trust = (sentiment / 2.0) + 0.5
            profile.trust_score = (profile.trust_score * (1 - alpha)) + (target_trust * alpha)
            profile.trust_score = max(0.0, min(1.0, profile.trust_score))

        # 3. Save Back
        if col is not None:
             await col.update_one(
                 {"user_id": user_id, "business_id": business_id},
                 {"$set": profile.model_dump()},
                 upsert=True
             )
             logger.debug(f" [Profiler] Updated persona for {user_id} in MongoDB (Interactions: {profile.interaction_count})")
        else:
             logger.warning(" [Profiler] MongoDB offline. Cannot persist user persona.")
             
        # Return the updated profile state to be used by the pipeline
        return profile.model_dump()

    # Helper method for other skills to read the profile without mutations
    async def get_profile(self, user_id: str, business_id: str) -> Optional[Dict[str, Any]]:
        col = await self._collection()
        if col is not None:
            return await col.find_one({"user_id": user_id, "business_id": business_id})
        return None


    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

