"""

   COGNITIVE ROUTER  OS Level Dynamic Model Switcher                       
  Level 1: The Cluaiz OS  Universal Core                                     
                                                                              
  Role:    Decides which AI brain to use for each task:                       
            Fast Path (Qwen3 0.6B): Simple, fast, <100ms                    
            Deep Path (Qwen3 4B):  Complex reasoning, ~500ms                
                                                                              
  Rules:                                                                      
  - GREETING, short messages  Fast Path 0.6B                                
  - FRUSTRATION, long analysis, summaries  Deep Path 4B                     
  - POLICY_QUERY, ORDER  Fast Path (KB lookup is enough)                    
  - AMBIGUOUS + long text  Deep Path                                         
                                                                              
  Why:     Prevents wasting 4B GPU resources on "Hi" messages, and           
           prevents 0.6B from struggling with complex 10-line complaints.     

"""

from typing import Literal, Optional
from loguru import logger

from src.services.routing.intent_router import IntentLane
from src.services.routing.local_llm_router import local_router

#  Path Labels 

ModelPath = Literal["fast_0.6b", "deep_4b"]

#  Configuration 

# Message length threshold for forced deep path (in characters)
_DEEP_PATH_CHAR_THRESHOLD = 200

# Intents that ALWAYS get Deep Path regardless of message length
_FORCE_DEEP_INTENTS = {
    IntentLane.FRUSTRATION,  # Emotional complexity  4B empathy needed
    IntentLane.AMBIGUOUS,    # Unclear intent  4B better at figuring it out
}

# Intents that ALWAYS get Fast Path
_FORCE_FAST_INTENTS = {
    IntentLane.GREETING,      # Simple hello  0.6B more than enough
    IntentLane.POLICY_QUERY,  # KB lookup  intent is clear
    IntentLane.TECH_ISSUE,    # Structured extraction (device/OS/error)  no empathy needed
}


#  The Cognitive Router 

class CognitiveRouter:
    """
    OS-Level Dynamic Model Switcher.
    
    Called after IntentRouter to decide which model brain should handle
    the actual skill execution or response generation.
    """

    @staticmethod
    def decide(
        intent: str,
        user_message: str,
        force_override: Optional[ModelPath] = None
    ) -> ModelPath:
        """
        Returns 'fast_0.6b' or 'deep_4b' based on intent and message complexity.

        Args:
            intent: Output from IntentRouter.classify() (FROM IntentLane)
            user_message: The raw user message string
            force_override: If set, bypasses all logic and returns this path directly
        """
        if force_override:
            logger.debug(f" [CognitiveRouter] Force override  {force_override}")
            return force_override

        # Rule 1: Intent-based forced routing (highest priority)
        if intent in _FORCE_DEEP_INTENTS:
            path = "deep_4b"
            reason = f"intent={intent} requires deep reasoning"
            
        elif intent in _FORCE_FAST_INTENTS:
            path = "fast_0.6b"
            reason = f"intent={intent} is simple enough for fast path"
            
        # Rule 2: Message length-based routing (fallback for ORDER / AMBIGUOUS etc.)
        elif len(user_message) > _DEEP_PATH_CHAR_THRESHOLD:
            path = "deep_4b"
            reason = f"long message ({len(user_message)} chars)  needs deeper understanding"
            
        else:
            path = "fast_0.6b"
            reason = f"short message ({len(user_message)} chars)  fast path sufficient"

        logger.info(f" [CognitiveRouter] Path='{path}' | Reason: {reason}")
        return path

    @staticmethod
    async def generate(
        prompt: str,
        system: Optional[str] = None,
        intent: str = IntentLane.AMBIGUOUS,
        user_message: str = "",
        force_override: Optional[ModelPath] = None
    ) -> str:
        """
        Convenience method: decides the model path, then directly calls the right model.

        Returns:
            str: The LLM response text
        """
        path = CognitiveRouter.decide(
            intent=intent,
            user_message=user_message,
            force_override=force_override
        )

        if path == "deep_4b":
            return await local_router.deep_reason(prompt=prompt, system=system)
        else:
            return await local_router.quick_classify(prompt=prompt, system=system)


# Singleton
cognitive_router = CognitiveRouter()
