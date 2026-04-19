from typing import Dict, Any, List, Optional, Type
from pydantic import BaseModel, Field
from src.services.aiskills.engine.base_skill import BaseSkill
from src.services.aiskills.integration.adapters.shopify_bridge import ShopifyBridge
from src.services.aiskills.integration.adapters.woocom_bridge import WooCommerceBridge
from src.core.conversation.filter_engine import FilterEngine
from src.core.groq_client import groq_client
from src.core.config import settings
from loguru import logger

class ProductSearchInput(BaseModel):
    query: str = Field(..., description="Search term (e.g., 'red shoes', 'laptop under 50000')")
    max_price: Optional[float] = Field(None, description="Maximum price filter")
    min_price: Optional[float] = Field(None, description="Minimum price filter")
    category: Optional[str] = Field(None, description="Category filter (e.g., 'electronics')")
    limit: int = Field(5, ge=1, le=20, description="Max results to return")
    platform: str = Field("shopify", description="E-commerce platform ('shopify' or 'woocommerce')")

class ProductSearchSkill(BaseSkill):
    """
    Search for products in inventory across 200+ languages with semantic ranking.
    """
    def __init__(self):
        super().__init__(
            name="product_search",
            description="Search for products in inventory across 200+ languages with semantic ranking."
        )
        self.shopify = ShopifyBridge()
        self.woocommerce = WooCommerceBridge()
        self.filter_engine = FilterEngine()
        self.client = groq_client
        self.model = settings.GROQ_MODEL
    
    @property
    def input_model(self) -> Type[BaseModel]:
        return ProductSearchInput

    async def _run(self, params: ProductSearchInput, entities: Dict[str, Any], platform: str, **kwargs) -> Dict[str, Any]:
        """
        Search products with natural language across all supported platforms.
        """
        try:
            # 1. Fetch products from platform
            if params.platform == "shopify":
                products = await self.shopify.fetch_products(limit=50)
            else:
                products = await self.woocommerce.fetch_products(limit=50)
            
            # 2. Local filtering & Semantic match
            filtered = self.filter_engine.filter_products(
                products=products,
                max_price=params.max_price,
                min_price=params.min_price,
                category=params.category,
                search_term=params.query,
                limit=params.limit
            )
            
            # 3. Generate conversation-ready summary using LLM
            summary = ""
            if filtered:
                prompt = f"""
                Summarize these product results for a customer query: "{params.query}"
                Products: {filtered}
                
                Requirements:
                - Highlight the best matches.
                - Keep it punchy and sales-oriented.
                - Do NOT use hardcoded marketing fluff. Use the data.
                """
                
                try:
                    response = await self.client.generate_response(
                        model=self.model,
                        messages=[{"role": "system", "content": "You are a professional retail assistant."},
                                 {"role": "user", "content": prompt}],
                        temperature=0.0
                    )
                    summary = response.choices[0].message.content.strip()
                except Exception:
                    summary = self.filter_engine.summarize_for_llm(filtered, "product")
            
            return {
                "count": len(filtered),
                "products": filtered,
                "summary": summary,
                "platform_used": params.platform
            }
        
        except Exception as e:
            logger.error(f"Product search failed: {e}")
            raise e

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

