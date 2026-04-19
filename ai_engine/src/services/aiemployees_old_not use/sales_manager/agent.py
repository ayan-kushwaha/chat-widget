from ..base_employee import BaseEmployee

class SalesManager(BaseEmployee):
    """
    Rocky: The Global Sales Closer.
    Powered by product_search and communication skills.
    """
    def __init__(self):
        super().__init__(
            name="Rocky",
            role="Sales Manager",
            folder_name="sales_manager",
            allowed_skills=["product_search", "email_template", "whatsapp_template"]
        )
        
    def specific_task(self):
        return "Closing deals and driving global revenue."
