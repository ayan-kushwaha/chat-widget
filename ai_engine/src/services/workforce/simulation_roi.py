from loguru import logger
from typing import Dict, Any

class SimulationROI:
    """
    The 'Time-Travel' ROI Engine.
    Predicts 30-day savings and automation impact.
    """

    def calculate_projection(self, discovery_result: Dict[str, Any], role: str) -> Dict[str, Any]:
        """
        Calculates impact based on the discovery reasoning.
        """
        roi_str = discovery_result.get("projected_roi", "10-20 hours/mo")
        
        # Simple extraction logic for demo
        try:
            hours = int(''.join(filter(str.isdigit, roi_str.split('-')[0])))
        except:
            hours = 15

        savings_per_hour = 25 # Default USD hourly rate for a professional
        monthly_savings = hours * savings_per_hour
        
        projection = {
            "role": role,
            "monthly_hours_saved": hours,
            "projected_monthly_savings": f"${monthly_savings}",
            "efficiency_gain": "35-50%",
            "automation_confidence": "High"
        }
        
        logger.info(f" ROI Projection generated for {role}: {hours} hours saved.")
        return projection

# Singleton
simulation_roi = SimulationROI()
