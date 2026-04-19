
import asyncio
from typing import Dict, List, Optional, Tuple
from loguru import logger
from src.services.ai.ambiguity_engine import engine
import time
from src.brain.phases.phase_04_support import Phase04Support
from src.brain.phases.phase_05_sales import Phase05Sales

# Types
class PhaseConfig:
    def __init__(self, phase_id: str, keywords: List[str], description: str):
        self.phase_id = phase_id
        self.keywords = [k.lower() for k in keywords]
        self.description = description

class BrainRouter:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BrainRouter, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    @staticmethod
    def get_phase_class(phase_id: str):
        """Factory pattern to get the Phase Instance"""
        # Dynamic import to avoid circular dependency
        if phase_id == "phase_01_onboarding":
            from src.brain.phases.phase_01_onboarding import Phase01Onboarding
            return Phase01Onboarding()
        elif phase_id == "phase_02_discovery":
            from src.brain.phases.phase_02_discovery import Phase02Discovery
            return Phase02Discovery()
        elif phase_id == "phase_03_booking":
            from src.brain.phases.phase_03_booking import Phase03Booking
            return Phase03Booking()
        elif phase_id == "phase_04_support":
            from src.brain.phases.phase_04_support import Phase04Support
            return Phase04Support()
        elif phase_id == "phase_05_sales":
            from src.brain.phases.phase_05_sales import Phase05Sales
            return Phase05Sales()
        
        from src.brain.phases.phase_01_onboarding import Phase01Onboarding
        return Phase01Onboarding()

    def __init__(self):
        if self.initialized:
            return
            
        logger.info(" Brain Router V4 (Powered by Ambiguity Engine) initializing...")
        self.engine = engine
        self.phases: Dict[str, PhaseConfig] = {}
        self.phase_embeddings = {}
        self._load_registry()
        self._precompute_embeddings()
        
        logger.success(" Brain Router V4 Ready.")
        self.initialized = True

    def _load_registry(self):
        """
        Registry of all 19 Phases (Departments).
        In V2, this could dynamically load from the 'phases' folder.
        """
        # TODO: Move this to a separate config file later
        self.phases = {
            "phase_01_onboarding": PhaseConfig(
                "phase_01_onboarding", 
                ["hi", "hello", "start", "login", "register", "wait", "who are you", "greeting"],
                "Identity verification, collecting name/email, and initial greeting."
            ),
            "phase_02_discovery": PhaseConfig(
                "phase_02_discovery",
                ["need", "want", "looking for", "problem", "issue", "help me decide", "guide me"],
                "Analyzing user needs and mapping pain points to solutions."
            ),
            "phase_03_booking": PhaseConfig(
                "phase_03_booking",
                ["book", "meeting", "schedule", "appointment", "calendar", "time", "date", "slot", "reserve"],
                "Handling calendar bookings, slot checking, and rescheduling."
            ),
            "phase_04_support": PhaseConfig(
                "phase_04_support",
                ["help", "issue", "problem", "bug", "error", "broken", "support", "ticket", "not working"],
                "Customer support, troubleshooting, and Q&A."
            ),
            "phase_05_sales": PhaseConfig(
                "phase_05_sales",
                ["price", "cost", "buy", "purchase", "discount", "offer", "package", "plan", "features"],
                "Pricing, feature explanation, and value proposition."
            )
        }

    async def _precompute_embeddings(self):
        """Encodes phase descriptions for semantic matching (Async Ready)"""
        if self.phase_embeddings:
            return
            
        logger.info(" Precomputing Phase Embeddings...")
        for phase_id, config in self.phases.items():
            text = f"{config.description} {' '.join(config.keywords)}"
            self.phase_embeddings[phase_id] = await self.engine.encode(text)
        logger.success(" Phase Embeddings Loaded.")

    async def route(self, user_text: str) -> Tuple[str, float]:
        """
        The Traffic Police Logic 
        Returns: (selected_phase_id, confidence_score)
        """
        # Ensure embeddings are ready
        await self._precompute_embeddings()
        
        start_time = time.time()
        text_lower = user_text.lower()
        
        # 1. FAST PATH: Keyword Exact Match (O(1))
        for phase_id, config in self.phases.items():
            for keyword in config.keywords:
                if f" {keyword} " in f" {text_lower} " or text_lower.startswith(keyword):
                    logger.debug(f" Fast Route Triggered: {phase_id} (Keyword: {keyword})")
                    return phase_id, 1.0

        try:
            # 2. SLOW PATH: Use Ambiguity Engine
            user_embedding = await self.engine.encode(user_text)
            
            best_phase = "phase_01_onboarding"
            highest_score = -1.0
            
            for phase_id, phase_emb in self.phase_embeddings.items():
                # Correctly use refactored cosine similarity
                score = self.engine._cosine_similarity(user_embedding, phase_emb)
                
                if score > highest_score:
                    highest_score = score
                    best_phase = phase_id
            
            elapsed = time.time() - start_time
            logger.info(f" Semantic Route: {best_phase} (Score: {highest_score:.2f}) [Took {elapsed:.3f}s]")
            
            if highest_score < 0.3:
                return "phase_01_onboarding", highest_score

            return best_phase, highest_score

        except Exception as e:
            logger.error(f" Routing Error: {e}")
            return "phase_01_onboarding", 0.0

# Independent Test
if __name__ == "__main__":
    router_test = BrainRouter()
    # Mock calls
    print(asyncio.run(router_test.route("I want to book a meeting")))
    print(asyncio.run(router_test.route("My internet is not working")))
    print(asyncio.run(router_test.route("Who are you?")))

# Global Instance
brain_router = BrainRouter()
