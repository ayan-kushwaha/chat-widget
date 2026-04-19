"""
 SkillFactory V2  Two-Stage Routing Engine
==============================================
V2 Changes:
  Stage 1: BGE-M3  Qdrant/Registry cosine match  TOP 2 candidates (1-2ms, ZERO LLM)
  Stage 2: Qwen3:0.6b confirms best skill from top 2 (< 50ms, CPU only)

  This replaces the old single-stage cosine  auto-execute flow.
  Result: Faster routing + higher accuracy because 0.6b understands nuance
  that pure cosine similarity can miss.

  ADDED: context_package flows through get_skill_for_execution()
"""

from typing import Any, Optional, Dict, List, Tuple
from loguru import logger
from .registry import SkillRegistry
from .base_skill import BaseSkill
from src.services.aiskills.types import ContextPackage
from enum import Enum


class ConfidenceTier(Enum):
    AUTO     = "auto"      # > 0.85  auto-execute without confirmation
    CONFIRM  = "confirm"   # 0.600.84  ask user to confirm
    FALLBACK = "fallback"  # < 0.60  route to general 4b chat


class SkillFactory:
    """
    Two-Stage Skill Dispatch Engine.

    Stage 1 (BGE-M3 cosine):  Returns top-2 candidates, zero LLM cost.
    Stage 2 (Qwen3:0.6b):     Reads both candidates + user message  picks winner.

    ConfidenceTier is set AFTER Stage 2  not just from cosine score alone.
    """

    AUTO_THRESHOLD    = 0.85
    CONFIRM_THRESHOLD = 0.60

    #  Stage 1 + 2 combined 

    @staticmethod
    async def get_skill_for_execution(
        query: str,
        role:            str = "customer",
        context_package: Optional[ContextPackage] = None,
        use_llm_confirm: bool = True
    ) -> Dict[str, Any]:
        """
        V2 main entry point. Full two-stage routing.

        Args:
            query:           User's message
            role:            'customer' or 'boss'
            context_package: Runtime context (will be passed to skill on execution)
            use_llm_confirm: If False, skip Stage 2 and use cosine score only (fast mode)

        Returns:
            {
                "skill_id":       str,
                "score":          float,
                "tier":           ConfidenceTier,
                "skill_instance": BaseSkill | None,
                "context_package": ContextPackage
            }
        """
        context_package = context_package or ContextPackage()

        #  Stage 1: BGE-M3 cosine  top-2 candidates (1-2ms) 
        top_candidates = await SkillRegistry.find_top_skills(query, top_k=2, role=role)

        if not top_candidates:
            logger.warning(f" [Factory] No skills in registry for role: {role}")
            return SkillFactory._fallback_result(context_package)

        best_skill_id, best_score = top_candidates[0]

        #  Stage 2: Qwen3:0.6b confirms (optional, < 50ms on CPU) 
        if use_llm_confirm and len(top_candidates) >= 2:
            confirmed_id, confirmed_score = await SkillFactory._llm_confirm(
                query=query,
                candidates=top_candidates,
                context_package=context_package
            )
            if confirmed_id:
                best_skill_id = confirmed_id
                best_score    = confirmed_score

        #  Determine confidence tier 
        if best_score >= SkillFactory.AUTO_THRESHOLD:
            tier = ConfidenceTier.AUTO
        elif best_score >= SkillFactory.CONFIRM_THRESHOLD:
            tier = ConfidenceTier.CONFIRM
        else:
            tier = ConfidenceTier.FALLBACK

        #  Instantiate skill 
        skill_instance = None
        if tier != ConfidenceTier.FALLBACK:
            skill_instance = SkillRegistry.get_skill_instance(best_skill_id)
            logger.info(
                f" [Factory] Dispatching: {best_skill_id} | "
                f"Score: {best_score:.2f} | Tier: {tier.value} | Role: {role}"
            )
        else:
            logger.warning(
                f" [Factory] Low confidence ({best_score:.2f}) for '{query[:50]}' "
                f" Fallback to general 4b chat"
            )

        return {
            "skill_id":       best_skill_id,
            "score":          best_score,
            "tier":           tier,
            "skill_instance": skill_instance,
            "context_package": context_package,
        }

    #  Stage 2: Qwen3:0.6b confirmation 

    @staticmethod
    async def _llm_confirm(
        query: str,
        candidates: List[Tuple[str, float]],
        context_package: ContextPackage
    ) -> Tuple[Optional[str], float]:
        """
        Uses Qwen3:0.6b to confirm the best skill from top-2 cosine candidates.
        This catches cases where cosine similarity picks the wrong skill due to
        token overlap without semantic alignment.

        Returns (confirmed_skill_id, adjusted_score) or (None, 0.0) if 0.6b call fails.
        """
        try:
            from src.services.routing.local_llm_router import local_router

            candidate_list = "\n".join(
                [f"  {i+1}. {cid} (cosine={score:.2f})" for i, (cid, score) in enumerate(candidates)]
            )

            prompt = f"""You are a skill router. Given a user message, pick the BEST matching skill.

User message: "{query}"
Business language: {context_package.business_dna.language_preference}

Skill candidates:
{candidate_list}

Reply with ONLY the skill number (1 or 2) and nothing else. No explanation."""

            response = await router.quick_classify(prompt)
            choice = response.strip()

            if choice in ("1", "2"):
                idx          = int(choice) - 1
                skill_id, _  = candidates[idx]
                # Boost score slightly for LLM confirmation
                _, orig_score = candidates[idx]
                confirmed_score = min(orig_score + 0.05, 1.0)
                logger.debug(
                    f" [Factory Stage-2] 0.6b confirmed: choice={choice}  {skill_id}"
                )
                return skill_id, confirmed_score

        except Exception as e:
            logger.warning(f" [Factory] 0.6b confirmation failed: {e}. Using cosine result.")

        return None, 0.0

    #  Legacy V1 compat 

    @staticmethod
    async def get_skill_with_confidence(query: str) -> Dict[str, Any]:
        """V1 compat  single-stage routing without context_package."""
        return await SkillFactory.get_skill_for_execution(
            query=query,
            use_llm_confirm=False   # V1 mode: cosine only
        )

    @staticmethod
    async def get_skill(query: str) -> Optional[Any]:
        """V1 legacy: auto-triggers only if cosine > 0.85."""
        result = await SkillFactory.get_skill_with_confidence(query)
        if result["tier"] == ConfidenceTier.AUTO:
            return result["skill_instance"]
        return None

    @staticmethod
    def list_all_skills():
        return SkillRegistry._skills.keys()

    #  Internal helpers 

    @staticmethod
    def _fallback_result(context_package: ContextPackage) -> Dict[str, Any]:
        return {
            "skill_id":        None,
            "score":           0.0,
            "tier":            ConfidenceTier.FALLBACK,
            "skill_instance":  None,
            "context_package": context_package,
        }
