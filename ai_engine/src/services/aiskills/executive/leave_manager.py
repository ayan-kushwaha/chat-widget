"""
Leave Manager Skill
Tracks and processes employee leave requests.
"""
from typing import Dict, Any, List
from ..base_skill import BaseSkill
from datetime import datetime

class LeaveManagerSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="leave_manager",
            description="Manage employee leave balances, status, and requests."
        )
        self.required_params = ["employee_id", "leave_type"]
        # Mock DB for demonstration - usually this would hit a real HRMS API
        self.mock_balances = {
            "EMP001": {"sick": 10, "casual": 12, "earned": 15},
            "default": {"sick": 5, "casual": 5, "earned": 5}
        }

    async def _run(
        self, 
        employee_id: str, 
        leave_type: str, 
        action: str = "check",  # "check" or "request"
        days: int = 0,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Check balance or process leave request.
        """
        try:
            balance = self.mock_balances.get(employee_id, self.mock_balances["default"])
            leave_key = leave_type.lower().split()[0]  # Take first word like 'sick' from 'Sick Leave'
            
            current_bal = balance.get(leave_key, 0)
            
            if action == "check":
                return {
                    "status": "success",
                    "employee_id": employee_id,
                    "leave_type": leave_type,
                    "balance": current_bal,
                    "message": f"Current {leave_type} balance for {employee_id}: {current_bal} days."
                }
            
            elif action == "request":
                if days > current_bal:
                    return {
                        "status": "failed",
                        "message": f"Insufficient balance. Requested {days}, available {current_bal}."
                    }
                
                # Mock update
                new_balance = current_bal - days
                return {
                    "status": "success",
                    "action": "approved",
                    "remaining_balance": new_balance,
                    "message": f"Leave request for {days} days approved. Remaining: {new_balance} days."
                }
                
            return {"status": "error", "message": f"Unknown action: {action}"}
            
        except Exception as e:
            return {"status": "error", "message": f"Leave management failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

