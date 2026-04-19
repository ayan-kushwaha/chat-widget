from ..base_employee import BaseEmployee

class MarketingHead(BaseEmployee):
    """
    Zara: Marketing Strategy & Campaigns.
    Powered by web_search, campaign_analysis, chart_generator and report_generator.
    """
    def __init__(self):
        super().__init__(
            name="Zara",
            role="Marketing Head",
            folder_name="marketing_head",
            allowed_skills=["web_search", "campaign_analysis", "chart_generator", "report_generator", "sentiment_analysis", "message_formatter"]
        )
        
    def specific_task(self):
        return "Defining marketing strategies and tracking campaign performance."
