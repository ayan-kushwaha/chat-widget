import spacy
from loguru import logger
import numpy as np
import os

class KnowledgeAuditor:
    """
    Layer 1: The Local Hybrid Auditor (The Judge).
    Validates if a knowledge asset meets the Agent's requirements 
    using Zero-Cost Local NLP (Semantic + Keyword).
    
    Semantic embeddings powered by Ollama BGE-M3 (Pure Qdrant Architecture).
    """

    _nlp_model = None

    def __init__(self):
        pass

    @classmethod
    def _load_nlp(cls):
        if cls._nlp_model is None:
            logger.info(" Loading Spacy NLP Model...")
            try:
                cls._nlp_model = spacy.load("en_core_web_sm")
            except Exception:
                logger.warning("Spacy model 'en_core_web_sm' not found. Downloading...")
                from spacy.cli import download
                download("en_core_web_sm")
                cls._nlp_model = spacy.load("en_core_web_sm")

    @staticmethod
    async def _get_embedding(text: str) -> np.ndarray:
        """Gets embedding from Ollama via VectorStore."""
        from src.core.vector_store import VectorStore
        vs = VectorStore()
        embedding = await vs.get_embedding(text)
        return np.array(embedding)

    @staticmethod
    def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
        """NumPy cosine similarity."""
        dot = np.dot(a, b)
        norm = np.linalg.norm(a) * np.linalg.norm(b)
        return float(dot / norm) if norm > 0 else 0.0

    async def audit_asset(self, requirement: str, asset_content: str) -> dict:
        """
        Audits a single asset against a single requirement.
        Returns: {
            "passed": bool,
            "score": float (0-1),
            "reason": str,
            "match_type": "semantic" | "keyword" | "none"
        }
        """
        self._load_nlp()

        if not asset_content or not requirement:
            return {"passed": False, "score": 0.0, "reason": "Empty content or requirement", "match_type": "none"}

        # 1. Keyword Check (Fastest & Deterministic)
        keyword_score = self._check_keywords(requirement, asset_content)
        if keyword_score >= 0.5:
             logger.info(f" Keyword Match: {requirement} (Score: {keyword_score:.2f})")
             return {
                "passed": True,
                "score": keyword_score,
                "reason": f"Strong Keyword Match ({keyword_score:.2f})",
                "match_type": "keyword"
            }

        # 2. Semantic Check (Slower but Smarter - via Ollama)
        semantic_score = await self._check_semantic(requirement, asset_content)
        if semantic_score >= 0.35:
             logger.info(f" Semantic Match: {requirement} (Score: {semantic_score:.2f})")
             return {
                "passed": True,
                "score": semantic_score,
                "reason": f"Semantic Match ({semantic_score:.2f})",
                "match_type": "semantic"
            }

        logger.warning(f" Audit Failed: {requirement} (Max Score: {max(keyword_score, semantic_score):.2f})")
        return {
            "passed": False,
            "score": max(keyword_score, semantic_score),
            "reason": "Content not relevant to requirement.",
            "match_type": "none"
        }

    def _check_keywords(self, requirement: str, content: str) -> float:
        """
        Extracts Noun Chunks from Requirement and checks presence in Content.
        """
        doc_req = self._nlp_model(requirement.lower())
        doc_content = self._nlp_model(content[:5000].lower()) 

        req_keywords = {token.lemma_ for token in doc_req if token.pos_ in ["NOUN", "PROPN"]}
        
        if not req_keywords:
            return 0.0

        content_tokens = {token.lemma_ for token in doc_content}
        match_count = sum(1 for kw in req_keywords if kw in content_tokens)
        
        return match_count / len(req_keywords)

    async def _check_semantic(self, requirement: str, content: str) -> float:
        """
        Calculates Cosine Similarity between Requirement and Content Summary
        using Ollama BGE-M3 embeddings.
        """
        req_emb = await self._get_embedding(requirement)
        content_emb = await self._get_embedding(content[:1000])
        return self._cosine_sim(req_emb, content_emb)

    async def cross_check(self, query: str, context_chunk: str) -> float:
        """
        Layer 5: Runtime Hallucination Guard.
        Checks if the retrieved chunk actually answers the query.
        """
        if not query or not context_chunk:
            return 0.0
            
        query_emb = await self._get_embedding(query)
        context_emb = await self._get_embedding(context_chunk)
        return self._cosine_sim(query_emb, context_emb)
