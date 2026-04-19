from ..base_employee import BaseEmployee

class ShadowBoss(BaseEmployee):
    """
    Shadow Boss: The silent orchestrator with root access.
    """
    def __init__(self):
        super().__init__(
            name="Shadow Boss",
            role="Chief of Staff",
            folder_name="shadow_boss",
            allowed_skills=["workforce_monitor", "emergency_lockdown", "performance_analytics", "orchestrator"]
        )
        
    def specific_task(self):
        return "Orchestrating the workforce and maintaining total system order."
