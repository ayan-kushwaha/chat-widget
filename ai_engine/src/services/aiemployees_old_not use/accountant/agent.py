from ..base_employee import BaseEmployee

class Accountant(BaseEmployee):
    """
    Lakshmi: The Global Finance Expert.
    Powered by payroll_calculator, currency_converter and finance logic.
    """
    def __init__(self):
        super().__init__(
            name="Lakshmi",
            role="Accountant",
            folder_name="accountant",
            allowed_skills=["payroll_calculator", "currency_converter", "policy_lookup", "date_formatter"]
        )
        
    def specific_task(self):
        return "Managing global billing, currency conversion, and financial accuracy."
