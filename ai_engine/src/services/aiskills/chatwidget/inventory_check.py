from typing import Dict, Any, List, Optional, Type
from pydantic import BaseModel, Field
from src.services.aiskills.engine.base_skill import BaseSkill
from src.services.aiskills.integration.adapters.shopify_bridge import ShopifyBridge
from src.services.aiskills.integration.adapters.woocom_bridge import WooCommerceBridge
from loguru import logger

class InventoryCheckInput(BaseModel):
    product_name: str = Field(..., description="The name of the product to check stock for.")
    platform: str = Field("shopify", description="E-commerce platform ('shopify' or 'woocommerce')")

class InventoryCheckSkill(BaseSkill):
    """
    Check real-time stock levels for products across multiple e-commerce platforms.
    """
    def __init__(self):
        super().__init__(
            name="inventory_check",
            description="Check real-time stock levels for products across multiple e-commerce platforms."
        )
        self.shopify = ShopifyBridge()
        self.woocommerce = WooCommerceBridge()

    @property
    def input_model(self) -> Type[BaseModel]:
        return InventoryCheckInput

    async def _run(self, params: InventoryCheckInput, entities: Dict[str, Any], platform: str, **kwargs) -> Dict[str, Any]:
        """
        Check stock for a product with Pydantic-validated parameters.
        """
        try:
            # 1. Fetch products from the selected platform
            if params.platform == "shopify":
                products = await self.shopify.fetch_products(limit=50)
            else:
                products = await self.woocommerce.fetch_products(limit=50)
            
            # 2. Logic to find the product (case-insensitive)
            product = next((p for p in products if params.product_name.lower() in p["name"].lower()), None)
            
            if not product:
                return {
                    "found": False,
                    "message": f"Product '{params.product_name}' not found on {params.platform}."
                }

            # 3. Stock extraction (Handles bridge mock data)
            stock = product.get("stock", 0)
            
            return {
                "found": True,
                "product_name": product["name"],
                "stock_count": stock,
                "in_stock": stock > 0,
                "platform": params.platform
            }
                
        except Exception as e:
            logger.error(f"Inventory check failed: {e}")
            raise e

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

