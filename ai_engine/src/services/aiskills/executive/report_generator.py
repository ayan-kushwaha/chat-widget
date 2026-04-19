"""
Report Generator Skill
Automates creation of PDF invoices and data reports using ReportLab.
"""
from typing import Dict, Any, List
from ..base_skill import BaseSkill, skill_logger
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import os
from loguru import logger

class ReportGeneratorSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="report_generator",
            description="Generate professional PDF reports, invoices, and shipment labels for customers."
        )
        self.output_dir = "./generated_reports"
        os.makedirs(self.output_dir, exist_ok=True)
        self.required_params = ["data", "report_type"]

    async def _run(self, data: Dict[str, Any], report_type: str, **kwargs) -> Dict[str, Any]:
        """
        Generate a PDF report based on data.
        """
        try:
            filename = f"{report_type}_{data.get('id', 'temp')}.pdf"
            filepath = os.path.join(self.output_dir, filename)
            
            # Simple PDF creation using ReportLab
            c = canvas.Canvas(filepath, pagesize=A4)
            width, height = A4
            
            c.setFont("Helvetica-Bold", 20)
            c.drawString(100, height - 100, f"{report_type.upper()}")
            
            c.setFont("Helvetica", 12)
            y_pos = height - 150
            for key, value in data.items():
                c.drawString(100, y_pos, f"{key}: {value}")
                y_pos -= 20
            
            c.save()
            
            return {
                "status": "success",
                "report_url": filepath,
                "message": f"{report_type.title()} PDF generated successfully: {filename}"
            }
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return {"status": "error", "message": f"Report generation failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

