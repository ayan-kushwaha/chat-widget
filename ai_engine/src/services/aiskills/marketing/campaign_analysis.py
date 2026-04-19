"""
Campaign Analysis Skill
Analyzes marketing campaign performance and suggests optimizations.
"""
from typing import Dict, Any, List
from ..base_skill import BaseSkill
from src.core.groq_client import groq_client
from src.core.config import settings

class CampaignAnalysisSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="campaign_analysis",
            description="Analyze marketing campaign metrics (ROI, Clicks, Engagement) and provide optimization insights."
        )
        self.client = groq_client
        self.model = settings.GROQ_MODEL
        self.required_params = ["campaign_metrics"]

    async def _run(self, campaign_metrics: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Analyze metrics and provide insights using LLM.
        """
        try:
            lang = kwargs.get("language", "en")
            prompt = f"""
            Analyze these marketing campaign metrics and suggest specific optimizations.
            Metrics: {campaign_metrics}
            Language: {lang}
            
            Focus on ROI, customer acquisition cost, and engagement trends.
            Return ONLY the analysis text.
            """
            
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            analysis = response.choices[0].message.content.strip()
            
            return {
                "status": "success",
                "analysis": analysis,
                "message": analysis
            }
        except Exception as e:
            return {"status": "error", "message": f"Campaign analysis failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

