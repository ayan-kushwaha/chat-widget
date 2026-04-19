from ..base_employee import BaseEmployee

class InventoryManager(BaseEmployee):
    """
    Deepak: The Global Inventory Watchman.
    Powered by inventory_check, inventory_reorder and product_search skills.
    """
    def __init__(self):
        super().__init__(
            name="Deepak",
            role="Inventory Manager",
            folder_name="inventory_manager",
            allowed_skills=["inventory_check", "inventory_reorder", "product_search", "date_formatter"]
        )
        
    def specific_task(self):
        return "Monitoring stock levels and ensuring global catalog accuracy."
