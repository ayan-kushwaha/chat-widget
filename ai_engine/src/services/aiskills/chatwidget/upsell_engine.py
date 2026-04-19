from typing import Dict, Any, Type, List, Optional
from pydantic import BaseModel, Field
from src.services.aiskills.base_skill import (
    SemanticContract, 
    ContextPackage, 
    EscalationTrigger
)
from src.utils.logger import logger
from src.core.vector_store import VectorStore

class UpsellEngineInput(BaseModel):
    current_items: List[str] = Field(..., description="List of items currently in the user's cart or viewed")
    budget_flexibility: Optional[float] = Field(0.2, description="How much more the user might spend (0.0 to 1.0)")

class UpsellEngineContract(SemanticContract):
    """
     S5: Upsell Engine  The Revenue Booster.
    Suggests complementary products using vector similarity and Business DNA.
    """

    capability_statement = """
        I am an expert at product recommendations and upselling. 
        I can analyze what a customer is buying and suggest matching, 
        complementary, or premium products that enhance their experience. 
        I use semantic search to find cross-sell opportunities (e.g., suggesting a case for a phone) 
        and upsell opportunities (suggesting a better version of a product).
        I work for retail, ecommerce, and service-based businesses.
    """

    input_schema = UpsellEngineInput
    
    pii_fields = [] # No PII needed for product recommendations

    escalation_triggers = [
        EscalationTrigger(
            description="Upsell suggestion is significantly more expensive than current cart",
            condition="max([float(i.get('price', 0)) for i in execution_params.get('suggestions', [])] or [0]) > 2 * max([float(i.get('price', 100)) for i in execution_params.get('current_cart', [])] or [1])"
        )
    ]

    async def _run(
        self, 
        params: UpsellEngineInput, 
        entities: Dict[str, Any], 
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        
        logger.info(f" [UpsellEngine] Generating recommendations for: {params.current_items}")

        # 1. Read Business DNA
        industry = context_package.business_dna.industry_cluster
        
        # 2. Get Vector Store instance
        vector_store = VectorStore()
        
        # 3. Search for complementary products in Qdrant
        # We search in the business's product collection
        collection_name = f"{context_package.business_id}_products"
        
        recommendations = []
        for item in params.current_items:
            # Search for "Complementary to [item]" or just semantic neighbors
            query = f"Products that complement or go well with {item} in a {industry} context"
            try:
                hits = await vector_store.search(
                    collection_name=collection_name,
                    query=query,
                    limit=2,
                    score_threshold=0.7
                )
                for hit in hits:
                    recommendations.append({
                        "id": hit.metadata.get("product_id"),
                        "name": hit.metadata.get("name", hit.page_content[:30]),
                        "price": hit.metadata.get("price"),
                        "reason": f"Goes great with your {item}"
                    })
            except Exception as e:
                logger.warning(f" [UpsellEngine] Failed to search for {item}: {e}")

        # 4. Filter and De-duplicate
        unique_recs = {rec["id"]: rec for rec in recommendations if rec["id"]}.values()
        
        # 5. Build Response
        if not unique_recs:
            return {
                "status": "NO_RECOMMENDATIONS",
                "message": "We couldn't find any perfect matches right now, but check out our bestsellers!",
                "suggestions": []
            }

        return {
            "status": "SUCCESS",
            "industry_optimized": industry,
            "suggestions": list(unique_recs)[:3], # Return top 3
            "message": f"Since you're looking at {params.current_items[0]}, you might also like these:"
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

