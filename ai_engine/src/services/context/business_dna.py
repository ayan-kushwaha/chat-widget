"""
 Business DNA  Phase 1 Context Inference
===========================================
This module handles the "Inference of Identity".
Boss specifies NOTHING during onboarding  we read their documents and INFER.

Key DNA attributes:
  - industry_cluster:    (e.g., kirana_store, saas, lawyer)
  - market_tier:         (local_smb | regional | enterprise)
  - language_preference: (english | hindi | hinglish)
  - regulatory_env:      (india_gst | eu_gdpr | global)
  - pricing_model:       (margin_based | flat_fee | subscription)
  - platform:            (whatsapp_api | shopify | custom_web)

Lifecycle:
  1. Triggered once during onboarding Deep Dive.
  2. LLM (4b) reads KB summary and infers DNA object.
  3. JSON stored in MongoDB for that business.
  4. Injected into every BaseSkill execution via ContextPackage.
"""

from typing import Dict, Any, Optional
from loguru import logger
from pydantic import BaseModel, Field

# Local imports
from src.core.db.mongodb import get_mongodb
from src.services.aiskills.types import BusinessDNA


class BusinessDNAManager:
    """
    Manages the lifecycle of a business's identity.
    Handles persistence in MongoDB.
    """

    @staticmethod
    async def get_dna(business_id: str) -> BusinessDNA:
        """Fetches BusinessDNA from MongoDB. Falls back to default if missing."""
        try:
            db = await get_mongodb()
            dna_doc = await db.business_dna.find_one({"business_id": business_id})
            
            if dna_doc:
                # Remove MongoDB _id before parsing
                dna_doc.pop("_id", None)
                dna_doc.pop("business_id", None)
                return BusinessDNA(**dna_doc)
            
            logger.warning(f" [BusinessDNA] No DNA found for {business_id}. Using default.")
            return BusinessDNA()
        except Exception as e:
            logger.error(f" [BusinessDNA] Failed to fetch DNA for {business_id}: {e}")
            return BusinessDNA()

    @staticmethod
    async def update_dna(business_id: str, dna: BusinessDNA) -> bool:
        """Updates or creates BusinessDNA doc in MongoDB."""
        try:
            db = await get_mongodb()
            dna_dict = dna.__dict__
            
            await db.business_dna.update_one(
                {"business_id": business_id},
                {"$set": dna_dict},
                upsert=True
            )
            logger.success(f" [BusinessDNA] Record updated for {business_id}: {dna.industry_cluster}")
            return True
        except Exception as e:
            logger.error(f" [BusinessDNA] Update failed for {business_id}: {e}")
            return False

    @staticmethod
    async def infer_dna_from_kb(business_id: str, kb_sample: str) -> BusinessDNA:
        """
        Phase 1 Core Logic: LLM (4b) reads KB sample and infers the DNA.
        Called once during onboarding synthesis.
        """
        logger.info(f" [BusinessDNA] Running identity inference for {business_id}...")
        
        try:
            from src.services.routing.local_llm_router import LocalLLMRouter
            router = LocalLLMRouter()
            
            # 4b Brain does the deep inference
            prompt = f"""
            Analyze the following text from a business's knowledge base and infer its DNA.
            Text Sample: "{kb_sample[:2000]}"
            
            Inferred properties:
            1. INDUSTRY: e.g., food_retail, legal_services, logistics, ecommerce, manufacturing.
            2. TIER: local_smb (1 store), regional (multiple), or enterprise.
            3. LANGUAGE: Primary customer communication language (English, Hindi, Hinglish).
            4. PRICING: margin_based (retail), flat_fee (services), or subscription (saas).
            5. PLATFORM: whatsapp_api, shopify, or generic_web.
            
            Return JSON only with keys: industry_cluster, market_tier, language_preference, 
            regulatory_env, pricing_model, platform.
            """
            
            # Using 4b for deep reasoning
            dna_json = await router.deep_reason(prompt)
            
            # Simple cleanup of LLM response
            import json
            import re
            json_str = re.search(r'\{.*\}', dna_json, re.DOTALL).group()
            inferred_data = json.loads(json_str)
            
            dna = BusinessDNA(**inferred_data)
            await BusinessDNAManager.update_dna(business_id, dna)
            return dna

        except Exception as e:
            logger.error(f" [BusinessDNA] Inference failed: {e}")
            return BusinessDNA()


# Helper aliases for easier import
async def get_business_dna(business_id: str) -> BusinessDNA:
    return await BusinessDNAManager.get_dna(business_id)

async def update_business_dna(business_id: str, dna: BusinessDNA) -> bool:
    return await BusinessDNAManager.update_dna(business_id, dna)
