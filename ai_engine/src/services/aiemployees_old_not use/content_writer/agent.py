from ..base_employee import BaseEmployee

class ContentWriter(BaseEmployee):
    """
    Kabir: The Global Wordsmith. 
    Powered by message_formatter and content generation.
    """
    def __init__(self):
        super().__init__(
            name="Kabir",
            role="Content Writer",
            folder_name="content_writer",
            allowed_skills=["message_formatter", "product_search", "email_template", "whatsapp_template"]
        )
        
    def specific_task(self):
        return "Creating high-impact content and maintaining global brand voice."
