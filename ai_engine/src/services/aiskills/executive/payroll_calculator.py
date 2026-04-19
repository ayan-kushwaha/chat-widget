"""
Payroll Calculator Skill
Calculates salary components for employees based on base pay and tax rules.
"""
from typing import Dict, Any, Optional
from ..base_skill import BaseSkill

class PayrollCalculatorSkill(BaseSkill):
    def __init__(self):
        super().__init__(
            name="payroll_calculator",
            description="Calculate salary components including basic pay, HRA, taxes, and net salary."
        )
        self.required_params = ["base_salary"]

    async def _run(
        self, 
        base_salary: float, 
        bonus: float = 0.0, 
        deductions: float = 0.0, 
        tax_rate: float = 0.1,  # Default 10%
        currency: str = "INR",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute payroll calculation logic.
        """
        try:
            # Simple Indian-style (or generic) payroll logic
            hra = base_salary * 0.4  # 40% HRA
            gross = base_salary + hra + bonus
            tax_amount = gross * tax_rate
            net_salary = gross - tax_amount - deductions
            
            return {
                "status": "success",
                "breakdown": {
                    "base": base_salary,
                    "hra": hra,
                    "bonus": bonus,
                    "gross": gross,
                    "tax": tax_amount,
                    "deductions": deductions,
                    "net": round(net_salary, 2)
                },
                "currency": currency,
                "message": f"Net salary calculated: {round(net_salary, 2)} {currency}"
            }
        except Exception as e:
            return {"status": "error", "message": f"Payroll calculation failed: {str(e)}"}

    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

