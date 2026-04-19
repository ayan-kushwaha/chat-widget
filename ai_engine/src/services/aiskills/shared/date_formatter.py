"""
Date Formatter Skill
Resolves natural language dates into machine-readable formats for scheduling.
"""
from typing import Dict, Any
from ..base_skill import BaseSkill
from ..common.date_time import format_date_readable
import dateparser

class DateFormatterSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="date_formatter",
            description="Convert natural language dates (e.g., 'next Monday', 'tomorrow at 3pm') into ISO formats."
        )
        self.required_params = ["date_text"]

    async def _run(self, date_text: str, **kwargs) -> Dict[str, Any]:
        """
        Resolve date text.
        """
        try:
            # Using dateparser for natural language parsing
            dt = dateparser.parse(date_text)
            
            if not dt:
                return {
                    "status": "error",
                    "message": f"Could not understand the date/time: '{date_text}'"
                }
            
            readable = format_date_readable(dt.strftime("%Y-%m-%d"))
            iso_format = dt.isoformat()
            
            return {
                "status": "success",
                "iso": iso_format,
                "readable": readable,
                "timestamp": dt.timestamp(),
                "message": f"Date resolved to {readable} ({iso_format})"
            }
        except Exception as e:
            return {"status": "error", "message": f"Date processing failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

