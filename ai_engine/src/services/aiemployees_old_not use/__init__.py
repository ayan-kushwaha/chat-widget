"""
 Cluaiz AI Employee Registry
================================
Single import point for all 5 core employees.
Use `get_employee(role_id)` to instantiate any employee dynamically.
"""

from typing import Dict, Any, Optional

from .executive_pa.agent   import ExecutivePA
from .support_lead.agent   import SupportLead
from .tech_support.agent   import TechSupport
from .legal_advisor.agent  import LegalAdvisor
from .global_concierge.agent import GlobalConcierge
from .pr_manager.agent       import CrisisPRManager
from .data_harvester.agent   import DataHarvester
from .it_commander.agent    import ITCommander


#  Employee Registry 
# Maps role_id strings (as used in DB / context) to their Employee class.

EMPLOYEE_REGISTRY = {
    "executive_pa":   ExecutivePA,
    "anjali":         ExecutivePA,
    "support_lead":   SupportLead,
    "sarah":          SupportLead,
    "tech_support":   TechSupport,
    "it_commander":   ITCommander,
    "alex":           ITCommander,
    "legal_advisor":  LegalAdvisor,
    "vakil":          LegalAdvisor,
    "global_concierge": GlobalConcierge,
    "concierge":        GlobalConcierge,
    "pr_manager":       CrisisPRManager,
    "data_harvester":   DataHarvester,
}


def get_employee(
    role_id: str,
    business_context: Optional[Dict[str, Any]] = None
):
    """
    Factory to instantiate an employee by role_id.
    
    Usage:
        employee = get_employee("sarah", business_context={...})
        result = await employee.execute(user_message, context)
    """
    klass = EMPLOYEE_REGISTRY.get(role_id.lower())
    if not klass:
        raise ValueError(
            f"Unknown employee role_id: '{role_id}'. "
            f"Available: {list(EMPLOYEE_REGISTRY.keys())}"
        )
    
    # Only pass business_context if the class accepts it
    try:
        return klass(business_context=business_context or {})
    except TypeError:
        return klass()


__all__ = [
    "ExecutivePA",
    "SupportLead",
    "TechSupport",
    "LegalAdvisor",
    "GlobalConcierge",
    "CrisisPRManager",
    "DataHarvester",
    "ITCommander",
    "EMPLOYEE_REGISTRY",
    "get_employee",
]
