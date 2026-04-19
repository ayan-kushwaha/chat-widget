"""
Task Summary Skill
Generates executive summaries of project status, tasks, and roadblocks.
"""
from typing import Dict, Any, List
from ..base_skill import BaseSkill
from src.core.groq_client import groq_client
from src.core.config import settings

class TaskSummarySkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="task_summary",
            description="Summarize project milestones, pending tasks, and roadblocks for executive review."
        )
        self.client = groq_client
        self.model = settings.GROQ_MODEL
        self.required_params = ["project_data"]

    async def _run(self, project_data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Generate executive summary using LLM.
        """
        try:
            lang = kwargs.get("language", "en")
            prompt = f"""
            Generate a high-level executive summary of this project status.
            Data: {project_data}
            Language: {lang}
            
            Focus on:
            1. Completed Milestones
            2. Immediate Roadblocks
            3. Next Steps
            
            Return ONLY the summary text.
            """
            
            response = await self.client.generate_response(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            summary = response.choices[0].message.content.strip()
            
            return {
                "status": "success",
                "summary": summary,
                "message": summary
            }
        except Exception as e:
            return {"status": "error", "message": f"Task summary failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

