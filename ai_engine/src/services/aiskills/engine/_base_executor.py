from typing import List, Dict, Any, Optional, Callable
from abc import ABC, abstractmethod
from loguru import logger
import asyncio
import spacy
from src.services.aiskills.engine.factory import SkillFactory, ConfidenceTier
from src.services.aiskills.engine.loader import bootstrap_skills
from src.core.conversation.language_processor import (
    LanguageProcessor, 
    ConversationMemory, 
    EmotionalResponder
)
from src.services.context.runtime_injector import RuntimeInjector
from src.services.routing.shadow_boss import shadow_boss
from src.core.conversation.filter_engine import FilterEngine
from src.core.security.pii_masker import PIIMasker
from src.core.security.pii_masker import PIIMasker
from src.core.learning.feedback_manager import get_feedback_manager
from src.services.prompts.business_logic import BusinessLogicEngine
from src.services.workforce.knowledge_auditor import KnowledgeAuditor
from src.services.ai.chat_service import chat_ai_service

# from src.services.aiskills.engine.loader import bootstrap_skills
# bootstrap_skills()
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None
    logger.warning(" Spacy model not found. NER will be limited.")

class BaseEmployee:
    """
    Production-Ready Conversation-First AI Employee.
    Features: Confidence Tiers, Enhanced Slot Filling, Ambiguity Resolution.
    """
    
    def __init__(self, name: str, role: str, folder_name: str, allowed_skills: List[str] = None, business_context: Dict[str, str] = None):
        self.name = name
        self.role = role
        self.folder_name = folder_name
    def __init__(self, name: str, role: str, folder_name: str, allowed_skills: List[str] = None, business_context: Dict[str, str] = None, knowledge_requirements: List[str] = None):
        self.name = name
        self.role = role
        self.folder_name = folder_name
        self.allowed_skills = allowed_skills  # If None, all skills are allowed
        
        # Dynamic Persona Injection 
        self.user_defined_about = None
        self.knowledge_context = None
        self.business_context = business_context or {} # Local Business Logic Context
        self.knowledge_requirements = knowledge_requirements or []
        self.health_status = "HEALTHY" # HEALTHY | PARTIAL | CRITICAL
        self.missing_assets = []
        
        self.system_prompt = self._load_persona()
        
        # Start initial pulse check (async, so we schedule it?)
        # For now, we assume external trigger or safe default.
        
        # Conversation Intelligence
        # V2: Dual-Tier Conversation Memory (Short-Term tokens + Long-Term Vector DB)
        from src.services.aiskills.engine.memory.conversation_memory import ConversationMemoryManager
        self.memory = ConversationMemoryManager(session_id="default_sess", user_id="anonymous")
        self.language = LanguageProcessor()
        self.responder = EmotionalResponder()
        self.filter_engine = FilterEngine()
        
        # Security & Learning
        self.pii_masker = PIIMasker()
        self.feedback_manager = get_feedback_manager()
        
        # State Management
        self.awaiting_confirmation = False
        self.pending_skill = None
        self.pending_params = {}
        
        # Legacy support
        self.tools: Dict[str, Callable] = {}
        
    async def check_pulse(self):
        """Layer 4: Continuous Health Monitor. Updates health status."""
        from src.core.memory import memory
        if not self.knowledge_requirements:
            self.health_status = "HEALTHY"
            self.missing_assets = []
            return "HEALTHY"
            
        status_map = await memory.verify_asset_availability(self.knowledge_requirements)
        self.missing_assets = [name for name, exists in status_map.items() if not exists]
        
        if not self.missing_assets:
            self.health_status = "HEALTHY"
        elif len(self.missing_assets) == len(self.knowledge_requirements):
            self.health_status = "CRITICAL"
        else:
            self.health_status = "PARTIAL"
            
        if not self.missing_assets:
            self.health_status = "HEALTHY"
        elif len(self.missing_assets) == len(self.knowledge_requirements):
            self.health_status = "CRITICAL"
        else:
            self.health_status = "PARTIAL"
            
        # Update prompt to reflect status
        self.system_prompt = self._load_persona()
        return self.health_status

    async def update_knowledge_requirements(self, new_requirements: List[str]):
        """Layer 4: Hot-Swap Logic. Update required files and re-check pulse."""
        self.knowledge_requirements = new_requirements
        await self.check_pulse()
        logger.info(f" {self.name} updated knowledge requirements. New Status: {self.health_status}")

    def update_persona(self, about: str, context: str, business_context: Dict[str, str] = None):
        """Dynamically update the agent's soul and business rules."""
        self.user_defined_about = about
        self.knowledge_context = context
        if business_context:
            self.business_context = business_context
        self.system_prompt = self._load_persona()
        logger.info(f" {self.name} persona updated with new instructions & business logic.")

    def _load_persona(self) -> str:
        """Load character persona with dynamic injection."""
        base_prompt = f"You are {self.name}, the {self.role}. Talk naturally in Hinglish. Stay in character."
        
        # 1. Inject User Defined 'About Me' (The Soul)
        if self.user_defined_about:
            base_prompt += f"\n\nUSER DEFINED ROLE:\n{self.user_defined_about}"
            
        # 2. Inject Knowledge Context (The Brain)
        if self.knowledge_context:
            base_prompt += f"\n\nSTRICT KNOWLEDGE BASE:\n{self.knowledge_context}\n\nRULES:\n- Only answer based on the knowledge base above.\n- If info is missing, say 'Access Denied' or ask the user."
            
        # 3. Inject Business Logic (The Context Switch)
        if self.business_context:
            base_prompt += BusinessLogicEngine.generate_system_prompt(self.role, self.business_context)
            
        # 4. Inject Health Status Warnings
        if self.health_status == "PARTIAL":
            base_prompt += f"\n\nWARNING: You are missing critical knowledge files: {', '.join(self.missing_assets)}.\n- Do NOT attempt to answer questions related to these topics.\n- State clearly that you don't have access to this specific information."
        elif self.health_status == "CRITICAL":
            base_prompt += "\n\nCRITICAL ERROR: ALL KNOWLEDGE LOST. SYSTEM LOCKDOWN. DO NOT ANSWER USER QUERIES."

        return base_prompt

    async def execute(self, user_message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Production Execution with Security:
        1. PII masking for logs
        2. Handle confirmation if awaiting
        3. Semantic skill discovery with confidence
        4. Auto/Confirm/Fallback routing
        5. Feedback tracking
        """
        # 1. Inbound Privacy Scan (Layer E - Security)
        # Replaces hardcoded PIIMasker with Context-Aware LocalPrivacyEngine
        from src.services.aiskills.security.local_privacy_engine import LocalPrivacyEngine, PrivacyInput
        
        # We need a basic ContextPackage if shadow_boss hasn't built one yet
        temp_context = context.get("context_package", None)
        if not temp_context:
             from src.services.aiskills.types import ContextPackage
             temp_context = ContextPackage(employee_id=self.folder_name, business_id=context.get("business_id", ""))
             
        privacy_engine = LocalPrivacyEngine()
        privacy_inbound = await privacy_engine._run(
            params=PrivacyInput(text=user_message, direction="inbound", role=context.get("role", "customer")),
            entities={},
            context_package=temp_context
        )
        
        masked_msg = privacy_inbound.get("processed_text", user_message)
        
        # Store PII Token Vault in context for downstream skills (e.g., DB lookup)
        if privacy_inbound.get("vault"):
             context["pii_vault"] = privacy_inbound["vault"]
             logger.debug(f" PII Vault initialized with {len(privacy_inbound['vault'])} tokens.")
             
        logger.info(f" {self.name} processing: '{masked_msg}'")
        
        # 0. Check Health Integrity (Layer 6)
        # We should ideally check pulse periodically, but for now we enforce the current state.
        if self.health_status == "CRITICAL":
            return {
                "reply": " **CRITICAL SYSTEM ERROR**: My knowledge base has been deleted. I cannot function until my files are restored.",
                "status": "error",
                "agent_name": self.name
            }

        # Add to conversation memory (original text, not masked)
        self.memory.add_turn("user", user_message)
        
        # Log Journey Context for Synergy Visibility
        journey_step = context.get("current_journey_step", "Unknown")
        if journey_step != "Unknown":
            logger.info(f" SYNERGY: {self.name} is aware of User Journey Step: {journey_step}")
        
        # 0. Sync Business Context if provided
        new_biz_context = context.get("business_context")
        if new_biz_context and new_biz_context != self.business_context:
            self.business_context = new_biz_context
            self.system_prompt = self._load_persona()
            logger.info(f" {self.name} updated business logic based on context.")
        
        # 1. Handle Confirmation Response
        if self.awaiting_confirmation:
            return await self._handle_confirmation(user_message, context)
        
        # 1b. Resume Active Slot Filling Session (Multi-Turn)
        # If we were already asking the user for a missing parameter, capture their answer here.
        if self.pending_skill and not self.awaiting_confirmation:
            return await self._resume_slot_filling(user_message, context)
        
        # 2. Detect language and intent type and entities
        lang_code = await self.language.detect_language(user_message)
        intent_type = await self.language.detect_intent_type(user_message)
        entities = await self.language.extract_entities(user_message)
        
        # Store language in context
        context["language"] = lang_code
        
        # 3. Build Dual-Tier Memory Payload (Phase 2 Upgrade)
        memory_payload = await self.memory.build_context_payload(
            current_query=user_message,
            current_intent=intent_type
        )
        
        # 4. Process via Shadow Boss (Context + Routing + Discovery)
        # business_id usually comes from settings or context. Fallback to 'default'.
        boss_result = await shadow_boss.process_user_query(
            user_message=user_message,
            employee_id=self.folder_name,
            context=context,
            role=context.get("role", "customer"),
            memory_payload=memory_payload
        )
        
        tier            = boss_result["tier"]
        skill           = boss_result["skill_instance"]
        score           = boss_result["score"]
        context_package = boss_result["context_package"]
        intent_lane     = boss_result.get("intent_lane", "AMBIGUOUS")
        
        # Store intent_lane in context for downstream skills
        context["intent_lane"] = intent_lane
        
        # 4. Route Based on Intent Lane + Confidence Tier
        # POLICY_QUERY fast-path: skip skill execution, go straight to RAG
        from src.services.routing.intent_router import IntentLane
        if intent_lane == IntentLane.POLICY_QUERY and not skill:
            final_result = await self._fallback_conversation(user_message, intent_type, entities, lang_code, context_package)
        
        elif tier == ConfidenceTier.AUTO and skill:
            # HIGH CONFIDENCE: Auto-execute
            final_result = await self._auto_execute_skill(skill, user_message, entities, context, context_package)
        
        elif tier == ConfidenceTier.CONFIRM and skill:
            # MEDIUM CONFIDENCE: Ask confirmation
            final_result = await self._request_confirmation(skill, boss_result["skill_instance"].name if boss_result.get("skill_instance") else "unknown_skill", score)
        
        else:
            # LOW CONFIDENCE / GREETING / FALLBACK
            final_result = await self._fallback_conversation(user_message, intent_type, entities, lang_code, context_package)

        # 5. Outbound Privacy Scan (Layer E - Security)
        if "reply" in final_result:
            privacy_outbound = await privacy_engine._run(
                params=PrivacyInput(text=final_result["reply"], direction="outbound", role=context.get("role", "customer")),
                entities={},
                context_package=temp_context
            )
            final_result["reply"] = privacy_outbound.get("processed_text", final_result["reply"])
            
            if privacy_outbound.get("was_masked"):
                logger.info(f" Outbound PII masked for role: {context.get('role', 'customer')}")

        return final_result

    async def _auto_execute_skill(
        self, 
        skill, 
        user_message: str, 
        entities: Dict[str, Any], 
        context: Dict[str, Any],
        context_package: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Execute skill with high confidence, using schema-aware slot filling."""
        # V2 Schema-Aware Extraction (Batch 6 Upgrade)
        params = await self._extract_params(
            text=user_message,
            skill=skill,
            context_package=context_package
        )
        
        # Detect missing required params from Pydantic model fields
        missing = self._get_missing_slots(skill, params)
        
        if missing:
            # Enter multi-turn Slot Filling mode
            self.memory.update_slot("__collected__", params)
            self.pending_skill = skill
            question = self._generate_slot_question(missing[0], skill.name)
            self.memory.add_turn("agent", question)
            logger.info(f" [SlotFill] Skill='{skill.name}' waiting for: {missing}")
            return {
                "reply": question,
                "mode": "slot_filling",
                "missing_params": missing,
                "agent_name": self.name
            }
        
        # All slots filled  Execute skill
        return await self._execute_skill_with_params(skill, params, context, context_package)

    async def _resume_slot_filling(self, user_message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Resume multi-turn slot filling: merge new answer with existing collected slots."""
        skill = self.pending_skill
        context_package = context.get("context_package")
        
        # Extract only the new answer (LLM knows which field is expected from context)
        new_params = await self._extract_params(
            text=user_message,
            skill=skill,
            context_package=context_package
        )
        
        # Merge onto previously collected slots
        collected = self.memory.slots.get("__collected__", {})
        collected.update({k: v for k, v in new_params.items() if v is not None})
        self.memory.update_slot("__collected__", collected)
        
        # Check if anything still missing
        missing = self._get_missing_slots(skill, collected)
        
        if missing:
            # Still more to collect
            question = self._generate_slot_question(missing[0], skill.name)
            self.memory.add_turn("agent", question)
            logger.info(f" [SlotFill] Still waiting for: {missing}")
            return {
                "reply": question,
                "mode": "slot_filling",
                "missing_params": missing,
                "agent_name": self.name
            }
        
        # All slots filled  reset state and execute
        self.pending_skill = None
        return await self._execute_skill_with_params(skill, collected, context, context_package)

    def _get_missing_slots(self, skill, params: Dict[str, Any]) -> List[str]:
        """Detect which required fields from the Pydantic input_schema are missing."""
        if not hasattr(skill, "input_schema"):
            # Legacy: fall back to metadata["required_params"]
            required = getattr(skill, "metadata", {}).get("required_params", [])
            return [p for p in required if not params.get(p)]
        
        try:
            model = skill.input_schema
            missing = []
            for field_name, field_info in model.model_fields.items():
                # A field is required if it has no default (is_required())
                if field_info.is_required() and not params.get(field_name):
                    missing.append(field_name)
            return missing
        except Exception:
            return []

    async def _execute_skill_with_params(
        self, skill, params: Dict[str, Any], context: Dict[str, Any], context_package: Optional[Any]
    ) -> Dict[str, Any]:
        """Execute the skill once all slots are filled."""
        if hasattr(skill, "_execute"):
            result = await skill._execute(context_package=context_package, **params)
        else:
            result = await skill.run(**params)
        
        lang = context.get("language", "en")
        if result.get("status") == "success":
            reply = self.responder.generate_success(result.get('message', ''), language=lang)
            
            # ---  [Phase 5.5] WIRING SURGERY: Hebbian Learning ---
            try:
                from src.services.neural.neurons.factory import factory
                import asyncio
                org_id = context.get("org_id", "default_org")
                skill_id = getattr(skill, "name", "unknown_skill").replace(" ", "_").lower()
                
                # Spawn existing neuron to trigger its 'touch' mechanism
                skill_neuron = factory.spawn("Skill", skill_id, org_id)
                # Apply positive reinforcement (Hebbian link strengthening)
                asyncio.create_task(skill_neuron.touch(reward=1.0))
                logger.info(f" [Hebbian] Skill '{skill_id}' reinforced (+1.0) after successful execution.")
            except Exception as ne:
                logger.warning(f" [Hebbian] Failed to reinforce skill '{getattr(skill, 'name', 'unknown')}': {ne}")
            # --- END WIRING SURGERY ---
            
        else:
            reply = self.responder.generate_error(result.get('message', ''), language=lang)
        
        self.memory.add_turn("agent", reply)
        return {
            "reply": reply,
            "tool_used": skill.name,
            "confidence": "high",
            "agent_name": self.name
        }

    async def _request_confirmation(self, skill, skill_id: str, score: float) -> Dict[str, Any]:
        """Ask user to confirm intent."""
        self.awaiting_confirmation = True
        self.pending_skill = skill
        
        # Hinglish confirmation templates
        confirmations = [
            f"Boss, aap {skill_id.replace('_', ' ')} karna chahte hain? (Haan/Nahi)",
            f"Mujhe lagta hai aap {skill_id.replace('_', ' ')} ki baat kar rahe hain. Sahi hai?",
            f"Confirm kar loon - {skill_id.replace('_', ' ')}? (Score: {score:.0%})"
        ]
        
        import random
        reply = random.choice(confirmations)
        self.memory.add_turn("agent", reply)
        
        return {
            "reply": reply,
            "mode": "awaiting_confirmation",
            "pending_skill": skill_id,
            "confidence": "medium",
            "agent_name": self.name
        }

    async def _handle_confirmation(self, user_message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user's confirmation response."""
        intent_type = await self.language.detect_intent_type(user_message)
        
        if intent_type == "affirm":
            # User confirmed - execute skill
            self.awaiting_confirmation = False
            skill = self.pending_skill
            pending_skill_id = skill.name
            self.pending_skill = None
            
            context_package = context.get("context_package")
            params = await self._extract_params(text=user_message, skill=skill, context_package=context_package)
            
            # Record success feedback
            self.feedback_manager.record_success(
                user_message=user_message,
                skill_id=pending_skill_id,
                confidence_score=0.75,
                user_id=context.get("user_id", "default")
            )
            
            return await self._execute_skill_with_params(skill, params, context, context_package)
        
        else:
            # User denied - record denial for learning
            skill = self.pending_skill
            if skill:
                self.feedback_manager.record_denial(
                    user_message=user_message,
                    predicted_skill=skill.name,
                    confidence_score=0.75,
                    user_id=context.get("user_id", "default")
                )
            
            self.awaiting_confirmation = False
            self.pending_skill = None
            
            reply = "Theek hai Boss, koi baat nahi. Main yahan hoon agar zaroorat ho."
            self.memory.add_turn("agent", reply)
            return {
                "reply": reply,
                "confirmed": False,
                "agent_name": self.name
            }

    async def _fallback_conversation(
        self, 
        user_message: str, 
        intent_type: str, 
        entities: Dict[str, Any], 
        language: str = "en",
        context_package: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Layer 5: Runtime Hallucination Guard + RAG Fallback.
        Instead of just greeting, we try to answer from Knowledge Base with strict checks.
        """
        dna_context = ""
        if context_package and context_package.business_dna:
            dna = context_package.business_dna
            dna_context = f"\n\nBUSINESS IDENTITY:\n- Industry: {dna.industry_cluster}\n- Tone: {dna.language_preference}\n- Platform: {dna.platform}"

        from src.core.memory import memory
        
        # 1. Attempt Retrieval (RAG)
        # Use default collection or specific if segmented
        results = await memory.query_similar(user_message, n_results=3, collection_name="default")
        
        if results:
            top_doc = results[0]
            content = top_doc.get("content", "")
            
            # 2. The Runtime Judge (Cross-Check)
            auditor = KnowledgeAuditor()
            relevance_score = await auditor.cross_check(user_message, content)
            
            logger.info(f" Layer 5 Judge: Query='{user_message}' | TopDocScore={relevance_score:.2f}")
            
            # 3. Decision Logic
            if relevance_score < 0.25:
                # SAFE MODE: Reject
                reply = "I'm sorry, I don't have enough verified information to answer that accurately. Please update my knowledge base."
                self.memory.add_turn("agent", reply)
                return {
                    "reply": reply,
                    "mode": "safe_mode_refusal",
                    "confidence": "low",
                    "agent_name": self.name
                }
            
            # 4. Generate Answer with Context (RAG + Protocol Cards)
            # NEW: Fetch Protocol Cards for additional business rules
            cards_context, used_cards = await self._fetch_protocol_cards(
                user_id="internal_agent_call",  # TODO: Pass actual user_id from context
                user_message=user_message,
                top_k=3
            )
            
            # Inject DNA, knowledge base content AND Protocol Cards
            system_instruction = (
                self.system_prompt + 
                dna_context + 
                f"\n\nRELEVANT KNOWLEDGE:\n{content}\n\nINSTRUCTION: Answer using ONLY the knowledge above."
            )
            
            if cards_context:
                system_instruction += f"\n\n{cards_context}\n\nIMPORTANT: Follow Protocol Card rules strictly."
            
            # Use ChatService to generate final answer
            # We construct a temporary message list
            messages = [{"role": "user", "text": user_message}]
            
            if cards_context:
                system_instruction += f"\n\n{cards_context}\n\nIMPORTANT: Follow Protocol Card rules strictly."
            
            # Use Local 4b (Expert Brain) via ShadowBoss
            reply = await shadow_boss.get_response_with_reasoning(
                user_message=user_message,
                system_instruction=system_instruction,
                context_package=context_package
            )
            self.memory.add_turn("agent", reply)
            
            return {
                "reply": reply,
                "mode": "rag_answer",
                "source": top_doc.get("metadata", {}).get("source", "unknown"),
                "confidence": "high",
                "agent_name": self.name
            }

        # 5. Generic Fallback (No Docs Found)
        greetings = {
            "en": f"Hello! I am {self.name}, your {self.role}. How can I help you today?",
            "hi": f"!  {self.name} ,  {self.role}       ?",
            "es": f"Hola! Soy {self.name}, su {self.role}. Cmo puedo ayudarle hoy?",
            "fr": f"Bonjour! Je suis {self.name}, votre {self.role}. Comment puis-je vous aider aujourd'hui?"
        }
        
        reply = greetings.get(language, greetings["en"])
        self.memory.add_turn("agent", reply)
        
        return {
            "reply": reply,
            "mode": "general_conversation",
            "intent_type": intent_type,
            "entities": entities,
            "agent_name": self.name,
            "conversation_context": self.memory.short_term.get_context_string()
        }

    def _generate_slot_question(self, param_name: str, skill_name: str) -> str:
        """Generate a natural Hinglish question for the missing parameter slot."""
        # Common field templates
        questions = {
            "client_name":    "Boss, kis client ke liye yeh kaam karna hai?",
            "amount":         "Kitna amount hai Boss? ( mein batao)",
            "email":          "Email address kya hai?",
            "product_name":   "Konsa product chahiye Boss?",
            "date":           "Kab ka date hai?",
            "address":        "Delivery address kya hai?",
            "quantity":       "Kitni quantity chahiye?",
            "phone":          "Phone number kya hai?",
            "order_id":       "Order ID bata do Boss.",
            "description":    "Thoda aur batao  kya problem hai?"
        }
        return questions.get(
            param_name,
            f"{param_name.replace('_', ' ').title()} kya hai Boss?"
        )

    async def _extract_params(self, text: str, skill=None, context_package=None, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        V2 Schema-Aware Param Extraction (Batch 6 Upgrade).
        Uses the skill's Pydantic input_schema to generate a JSON schema for targeted extraction.
        Falls back to legacy Spacy NER if no schema available.
        """
        # V2: Pydantic Schema-Based Extraction
        if skill and hasattr(skill, "input_schema"):
            try:
                import json as _json
                schema_json = _json.dumps(
                    skill.input_schema.model_json_schema(), indent=2
                )
                params = await self.language.extract_schema_entities(
                    text=text,
                    schema_json=schema_json,
                    context_package=context_package
                )
                # Remove None values so missing detection works correctly
                return {k: v for k, v in params.items() if v is not None}
            except Exception as e:
                logger.warning(f"Schema extraction failed, falling back to Spacy: {e}")
        
        # Legacy Fallback: Spacy NER
        params = {}
        if nlp:
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG"]:
                    params["client_name"] = ent.text
                if ent.label_ == "MONEY":
                    val = ent.text.replace("", "").replace("$", "").replace(",", "").strip()
                    try:
                        params["amount"] = float(val)
                    except: pass
        
        if not params:
            params["text"] = text
        
        return params

    async def _fetch_protocol_cards(self, user_id: str, user_message: str, top_k: int = 5):
        """Fetch relevant Protocol Cards for conversation context"""
        try:
            from src.services.workforce.card_retrieval_service import card_retrieval_service
            
            relevant_cards = await card_retrieval_service.query_relevant_cards(
                user_id=user_id,
                agent_id=self.folder_name,
                query_text=user_message,
                top_k=top_k
            )
            
            if relevant_cards:
                cards_context = card_retrieval_service.inject_cards_to_context(relevant_cards)
                logger.info(f" {self.name}: Injected {len(relevant_cards)} Protocol Cards")
                return cards_context, relevant_cards
            
            return "", []
            
        except Exception as e:
            logger.warning(f"Failed to fetch Protocol Cards: {e}")
            return "", []

    async def _track_card_usage(self, cards: list, user_id: str):
        """Update usage analytics for retrieved cards"""
        if not cards:
            return
        
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            from datetime import datetime
            import os
            
            mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cluaiz")
            client = AsyncIOMotorClient(mongo_uri)
            db = client.get_default_database()
            
            for card in cards:
                card_id = card.get("card_id")
                if card_id:
                    await db.protocolcards.update_one(
                        {"card_id": card_id},
                        {"$inc": {"usage_count": 1}, "$set": {"last_used_at": datetime.utcnow()}}
                    )
            
            logger.info(f" Updated usage for {len(cards)} Protocol Cards")
            
        except Exception as e:
            logger.warning(f"Failed to track card usage: {e}")
    
    def specific_task(self):
        """Each employee implements their specific logic."""
        pass
