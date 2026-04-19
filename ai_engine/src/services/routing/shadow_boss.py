"""
 Shadow Boss Orchestrator
===========================
The high-level manager that coordinates the 2nd stage of routing,
context assembly, and final reasoning using local Qwen3 models.

Goal: Keep BaseEmployee clean and ensure 'Brain' logic is centralized.
"""

from typing import Dict, Any, Optional, List
from src.services.aiskills.engine.factory import SkillFactory, ConfidenceTier
from src.services.context.runtime_injector import RuntimeInjector
from src.services.routing.local_llm_router import local_router
from src.services.routing.intent_router import intent_router, IntentLane
from src.services.routing.cognitive_router import cognitive_router
from src.utils.logger import logger
from src.services.aiskills.types import ContextPackage

class ShadowBoss:
    """
    Shadow Boss Orchestrator.
    Handles the transition from Skill Discovery to Context-Aware execution.
    """

    @staticmethod
    async def process_user_query(
        user_message: str,
        employee_id: str,
        context: Dict[str, Any],
        role: str = "customer",
        memory_payload: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        The main pipeline:
        0. Intent Pre-Routing (0.6b, <50ms)  NEW Batch 7
        1. Context Assembly (DNA + KB + Mandates)
        2. Skill Discovery (BGE + 0.6b confirm)  only if AMBIGUOUS or ORDER
        3. Logic branching: AUTO | CONFIRM | FALLBACK
        """
        business_id = context.get("business_id", "default")
        session_id  = context.get("session_id", "default")
        user_timezone = context.get("user_timezone")

        #  0. Intent Pre-Routing (Shadow Boss 0.6b) 
        intent_lane = await intent_router.classify(user_message)

        #  1. Assemble ContextPackage (Phase 2 Injection) 
        context_package = await RuntimeInjector.assemble_package(
            business_id=business_id,
            employee_id=employee_id,
            query=user_message,
            session_id=session_id,
            memory_payload=memory_payload,
            user_timezone=user_timezone
        )

        #  Fast-Path: FRUSTRATION  Force HandleFrustration 
        if intent_lane == IntentLane.FRUSTRATION:
            logger.warning(f" [ShadowBoss] FRUSTRATION detected  forcing HandleFrustration skill.")
            try:
                from src.services.aiskills.engine.factory import SkillFactory as SF
                frustration_skill = SF._registry.get("handle_frustration")
            except Exception:
                frustration_skill = None

            return {
                "tier":            ConfidenceTier.AUTO,
                "skill_instance":  frustration_skill,
                "skill_id":        "handle_frustration",
                "score":           1.0,
                "context_package": context_package,
                "intent_lane":     intent_lane,
            }

        #  Fast-Path: GREETING  Skip SkillFactory, go RAG/Fallback 
        if intent_lane == IntentLane.GREETING:
            logger.info(f" [ShadowBoss] GREETING detected  skipping SkillFactory.")
            return {
                "tier":            ConfidenceTier.FALLBACK,
                "skill_instance":  None,
                "skill_id":        None,
                "score":           0.0,
                "context_package": context_package,
                "intent_lane":     intent_lane,
            }

        #  Fast-Path: POLICY_QUERY  Neural OS Vectorless RAG 
        if intent_lane == IntentLane.POLICY_QUERY:
            logger.info(f" [ShadowBoss] POLICY_QUERY detected  Triggering Neural Navigator.")
            try:
                from src.database.mongo import db
                from src.services.neural.navigator import navigate_document
                
                if db.client:
                    # Find a document with a page_index for this org
                    doc = await db.client.cluaiz.documents.find_one(
                        {"org_id": business_id, "page_index": {"$exists": True}}
                    )
                    if doc and doc.get("page_index"):
                        nav_result = await navigate_document(
                            query=user_message,
                            yaml_tree=doc["page_index"],
                            max_nodes=3
                        )
                        # Inject the top nodes directly into the context package
                        if nav_result and nav_result.get("top_nodes"):
                            # We attach it dynamically to the context_package object
                            setattr(context_package, "injected_policy_nodes", nav_result["top_nodes"])
                            logger.info(f" [ShadowBoss] Navigator injected {len(nav_result['top_nodes'])} nodes.")
            except Exception as ex:
                logger.error(f" [ShadowBoss] Neural Navigator failed: {ex}")

        #  Standard Flow: ORDER / POLICY_QUERY / AMBIGUOUS 
        routing_result = await SkillFactory.get_skill_for_execution(
            query=user_message,
            role=role,
            context_package=context_package,
            use_llm_confirm=True
        )

        tier           = routing_result["tier"]
        skill          = routing_result["skill_instance"]
        score          = routing_result["score"]
        skill_id       = routing_result["skill_id"]
        context_package = routing_result.get("context_package", context_package)

        return {
            "tier":            tier,
            "skill_instance":  skill,
            "skill_id":        skill_id,
            "score":           score,
            "context_package": context_package,
            "intent_lane":     intent_lane,
        }

    @staticmethod
    async def get_response_with_reasoning(
        user_message: str,
        system_instruction: str,
        context_package: ContextPackage,
        intent: str = IntentLane.AMBIGUOUS
    ) -> str:
        """
        Uses the Cognitive Router to automatically pick 0.6B or 4B model,
        then injects Global Time Anchor + DNA Style into the system prompt.
        """
        # Inject True Global Context Time and DNA Style
        dna = context_package.business_dna
        time_anchor = f"\n\n[{context_package.temporal_anchor}]"
        styling = f"\n[DNA Style: {dna.industry_cluster} | {dna.language_preference} | {dna.platform}]"
        
        #  Inject Vectorless RAG Logic Nucleus if present
        policy_context = ""
        if hasattr(context_package, "injected_policy_nodes"):
            nodes = getattr(context_package, "injected_policy_nodes")
            policy_context = "\n\n[NEURAL OS POLICY CONTEXT]\n"
            for n in nodes:
                policy_context += f"- {n.get('title')}: {n.get('summary')}\n"
            
        combined_instruction = f"{system_instruction}{policy_context}{time_anchor}{styling}"
        
        #  The Cognitive Router: picks the right brain for this request
        response_text = await cognitive_router.generate(
            prompt=user_message,
            system=combined_instruction,
            intent=intent,
            user_message=user_message
        )
        
        return response_text

# Singleton
shadow_boss = ShadowBoss()
