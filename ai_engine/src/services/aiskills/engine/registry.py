"""
 SkillRegistry V2  Central Command for Semantic Contracts
=============================================================
V2 Changes:
  - Registers SemanticContract Python classes (not JSON files)
  - Pre-computes BGE-M3 embeddings of capability_statement at startup
  - find_best_skill() now returns TOP 2 candidates (for two-stage routing)
  - get_all_schemas() returns OpenAI-style tool calling schemas
  - Backwards compatible: also accepts old BaseSkill subclasses
"""

from typing import Dict, List, Optional, Any, Tuple, Type
import numpy as np
from loguru import logger

from .base_skill import BaseSkill


class SkillRegistry:
    """
    Central command for all Cluaiz skills.
    V2: Stores SemanticContract Python classes.
    Embeddings pre-computed on register() using BGE-M3 (via Ollama/VectorStore).
    """

    _skills:     Dict[str, Type[BaseSkill]] = {}
    _embeddings: Dict[str, np.ndarray]      = {}

    #  Embedding helper 

    @classmethod
    async def _get_embedding(cls, text: str) -> np.ndarray:
        """Gets BGE-M3 embedding from Ollama VectorStore."""
        try:
            from src.core.vector_store import VectorStore
            vs = VectorStore()
            embedding = await vs.get_embedding(text)
            return np.array(embedding)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return np.zeros(768)  # Fallback zero vector

    #  Registration 

    @classmethod
    async def register(cls, skill_class: Type[BaseSkill]) -> None:
        """
        Register a skill (SemanticContract or BaseSkill subclass).

        V2 key change:
          Embeds capability_statement (SemanticContract) or description (BaseSkill V1)
          for BGE-M3 semantic routing.
        """
        instance = skill_class()

        # Prefer SemanticContract capability_statement for richer routing embedding
        text_to_embed = (
            getattr(instance, "capability_statement", None)
            or getattr(instance, "_description_override", None)
            or ""
        ).strip()

        skill_id = (
            getattr(instance, "skill_id", None)
            or getattr(instance, "name", None)
            or skill_class.__name__
        )

        if not text_to_embed:
            logger.warning(
                f" [Registry] Skill '{skill_id}' has no capability_statement or description. "
                f"Routing accuracy will be low."
            )

        cls._skills[skill_id]     = skill_class
        cls._embeddings[skill_id] = await cls._get_embedding(text_to_embed)

        logger.success(
            f" [Registry] Registered: {skill_id} | "
            f"roles={getattr(instance, 'allowed_roles', ['all'])} | "
            f"V={'2' if hasattr(instance, 'capability_statement') else '1'}"
        )

    @classmethod
    def register_sync(cls, skill_class: Type[BaseSkill]) -> None:
        """
        Synchronous registration without embedding (for startup cataloguing).
        Use register() (async) for full semantic routing capability.
        """
        instance = skill_class()
        skill_id = (
            getattr(instance, "skill_id", None)
            or getattr(instance, "name", None)
            or skill_class.__name__
        )
        cls._skills[skill_id] = skill_class
        cls._embeddings[skill_id] = np.zeros(768)  # Placeholder  no embedding yet
        logger.info(f" [Registry] Catalogued (no embed): {skill_id}")

    #  Discovery 

    @classmethod
    async def find_top_skills(
        cls,
        user_query: str,
        top_k: int = 2,
        role: str = "customer"
    ) -> List[Tuple[str, float]]:
        """
        V2  Returns TOP K skill candidates for two-stage routing.

        Stage 1 (this method): BGE-M3 cosine similarity  top-k candidates (1-2ms, ZERO LLM)
        Stage 2 (in SkillFactory): Qwen3:0.6b confirms the best match (< 50ms, CPU)

        Args:
            user_query: The incoming user message
            top_k:      How many candidates to return (default: 2 for two-stage)
            role:       User role for RBAC pre-filter ('customer' | 'boss')

        Returns:
            List of (skill_id, cosine_score) tuples, sorted by score descending
        """
        if not cls._skills:
            return []

        query_embedding = await cls._get_embedding(user_query)
        scored = []

        for skill_id, skill_embedding in cls._embeddings.items():
            # RBAC pre-filter  skip skills this role cannot access
            instance = cls._skills[skill_id]()
            allowed_roles = getattr(instance, "allowed_roles", ["customer", "boss"])
            if role not in allowed_roles:
                logger.debug(f" [Registry] Skipping '{skill_id}'  role '{role}' not allowed")
                continue

            # A. Semantic Score (Cosine Similarity)
            norm = np.linalg.norm(query_embedding) * np.linalg.norm(skill_embedding)
            score = float(np.dot(query_embedding, skill_embedding) / norm) if norm > 0 else 0.0

            # B. Keyword Fallback (if semantic fails or score is extremely low)
            if score < 0.1:
                query_words = set(user_query.lower().split())
                cap = getattr(instance, "capability_statement", "").lower()
                # Simple word overlap count as a fallback score (max 0.15 to not beat real embeddings)
                overlap = sum(1 for word in query_words if len(word) > 3 and word in cap)
                if overlap > 0:
                    score = min(0.15, 0.05 * overlap)
                    logger.debug(f" [Registry] Keyword fallback for '{skill_id}': score={score:.2f}")

            scored.append((skill_id, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_k]

        logger.info(
            f" [Registry] Top-{top_k} candidates for '{user_query[:50]}...': "
            + " | ".join(f"{s}({sc:.2f})" for s, sc in top)
        )
        return top

    @classmethod
    async def find_best_skill(
        cls,
        user_query: str,
        role: str = "customer"
    ) -> Tuple[Optional[str], float]:
        """
        V1 compat: Returns only the single best skill.
        Internally uses find_top_skills().
        """
        top = await cls.find_top_skills(user_query, top_k=1, role=role)
        if top:
            return top[0]
        return None, 0.0

    #  Schema export (OpenAI-style tool calling) 

    @classmethod
    def get_all_schemas(cls) -> List[Dict[str, Any]]:
        """Returns OpenAI-style function schemas for all registered skills."""
        schemas = []
        for skill_id, skill_class in cls._skills.items():
            instance = skill_class()
            cap = getattr(instance, "capability_statement", "")
            schemas.append({
                "type": "function",
                "function": {
                    "name":        skill_id,
                    "description": cap or instance.name,
                    "parameters":  (
                        instance.input_schema.model_json_schema()
                        if instance.input_schema else {}
                    )
                }
            })
        return schemas

    #  Instantiation 

    @classmethod
    def get_skill_instance(cls, skill_id: str) -> Optional[BaseSkill]:
        """Returns a fresh instance of the requested skill."""
        skill_class = cls._skills.get(skill_id)
        if skill_class:
            return skill_class()
        logger.warning(f" [Registry] Skill '{skill_id}' not found in registry.")
        return None

    #  V1 compat alias 
    @classmethod
    def get_instance(cls, skill_id: str) -> Optional[BaseSkill]:
        return cls.get_skill_instance(skill_id)
