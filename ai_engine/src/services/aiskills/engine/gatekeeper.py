"""

    GATEKEEPER  SemanticContract [I2]                                      
  Pillar G (BaseSkill) + Pillar E (Shadow Boss)                               
                                                                              
  Role:    Dynamic Role-Based Access Control (RBAC) Enforcer.                 
  Layer:   ONE (runs AFTER Bouncer  before the 4b Expert Brain).             
                                                                              
  Enforces strict Owner  Customer isolation for every skill invocation.      
  "An absolute wall  the 4b Expert Brain never sees what Gatekeeper         
  already blocked."                                                           
                                                                              
  Design (ContextPackage-driven):                                             
    - NO hardcoded permission lists. Boss defines allowed_roles per skill.    
    - Runtime-injectable: Owner can promote a Customer to 'verified_customer' 
      (limited boss-like access) via ContextPackage boss_mandates at deploy.  
    - Action-based: Gatekeeper checks the requested ACTION, not just the      
      skill name. One skill can have mixed allowed roles per action.          
                                                                              
  NOTE: This CONTRACT skill is invoked explicitly for gate checks.            
        The `gatekeeper` decorator in core/security/gatekeeper.py handles    
        the skill-level RBAC at BaseSkill._execute() layer automatically.    
        Both layers work together  this skill enables programmatic checks.  

"""

from __future__ import annotations

import time
from typing import Dict, Any, List, Optional, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage, EscalationTrigger


#  Permission Registry 

# Default Owner-only ACTION registry.
# These actions represent DATA MUTATIONS or PRIVILEGED READS  never exposed to Customers.
# Boss can EXTEND this list via ContextPackage mandate (never shrink below minimum).
#
# Format: action_name  reason (shown in logs for audit trail)
_DEFAULT_OWNER_ONLY_ACTIONS: Dict[str, str] = {
    #  Financial
    "view_daily_revenue":       "Exposes daily revenue  owner-confidential.",
    "view_profit_loss":         "Full P&L  financial intelligence.",
    "view_payroll_data":        "Employee financial records  HR sensitive.",
    "approve_refund":           "Authorises a monetary transaction.",
    "override_discount_limit":  "Manual override of business pricing rules.",
    "view_all_transaction_logs": "Full audit trail  owner governance.",

    #  Inventory & Operations
    "delete_inventory_item":    "Destructive operation  permanent deletion.",
    "update_product_price":     "Pricing mutation  business-critical.",
    "approve_purchase_order":   "Spend authorisation.",
    "view_supplier_contracts":  "Confidential vendor agreements.",
    "multi_store_sync_trigger": "Cross-location mutation  owner-level.",

    #  Policy & Configuration
    "update_refund_policy":     "Policy mutation  affects all customers.",
    "update_discount_policy":   "Pricing policy  owner-controlled.",
    "deploy_ai_employee":       "Infrastructure change  admin only.",
    "modify_employee_protocol": "AI employee Constitution change.",
    "view_employee_constitution": "Internal system prompt  never exposed.",
    "approve_quarantine_item":  "Data Quarantine approval  Pillar C.",
    "override_quarantine":      "Forces KB conflict resolution  admin.",

    #  Security & Access
    "view_security_event_log":  "Shadow Boss monitor  security intelligence.",
    "blacklist_user":           "Blocks a user  admin authority.",
    "add_verified_customer":    "Role elevation  admin grant only.",
    "export_customer_data":     "Bulk PII export  GDPR/DPDP risk.",
    "view_all_chat_logs":       "Cross-session surveillance  owner only.",
    "revoke_api_access":        "Integration kill-switch  admin.",

    #  Knowledge Studio (Pillar D)
    "delete_knowledge_source":  "Destructive KB operation.",
    "publish_knowledge_update": "Goes live for all employees  admin.",
}

# Actions any authenticated Customer can perform
_CUSTOMER_ALLOWED_ACTIONS: set = {
    "ask_product_question",
    "check_order_status",
    "raise_support_ticket",
    "request_refund_initiation",   # Initiation only  approve_refund is owner-only
    "view_own_order_history",
    "update_own_profile",
    "request_callback",
    "get_store_hours",
    "view_public_policy",          # Read-only policy info  from KB
    "get_price_quote",
    "submit_review",
    "track_delivery",
}

# Elevated Customer tier (verified_customer)  Boss can grant this via mandate
_VERIFIED_CUSTOMER_EXTRA_ACTIONS: set = {
    "view_own_invoice_pdf",
    "initiate_exchange_request",
    "view_support_ticket_history",
}


#  Input Schema 

class GatekeeperInput(BaseModel):
    """
    Schema for a single RBAC gate check.
    action_requested : The exact action string the skill/router wants to execute.
    user_role        : Verified role from session  'owner' | 'customer' | 'verified_customer' | 'shadow_boss'.
    user_id          : Hashed user identifier for audit trail.
    target_skill_id  : The skill that will execute this action (for metadata).
    extra_context    : Optional dict of runtime values for mandate-based dynamic rules.
    """
    action_requested: str            = Field(..., description="Exact action name to gate-check.")
    user_role:        str            = Field(..., description="Verified user role from session JWT.")
    user_id:          str            = Field(default="anonymous")
    target_skill_id:  str            = Field(default="unknown", description="Skill requesting gate access.")
    extra_context:    Dict[str, Any] = Field(default_factory=dict,
                                             description="Runtime values for dynamic mandate evaluation.")


#  Gatekeeper SemanticContract 

class GatekeeperContract(SemanticContract):
    """
     Gatekeeper  The RBAC Wall Between Owner and Customer.

    This skill provides programmatic access control checks for the routing
    layer and skill orchestrator. It is the explicit companion to the
    `@gatekeeper` decorator in core/security/gatekeeper.py.

    Decorator = automatic (skill-level).   <- Already running in BaseSkill._execute()
    Contract  = explicit (action-level).   <- Called by routing layer on specific actions.

    Both layers together ensure zero privilege escalation.

    Dynamic permission model via ContextPackage:
        - Boss can ADD custom owner-only actions via mandate: "add_protected=action1,action2"
        - Boss can ELEVATE specific customers: "verified_customers=uid1,uid2"
        - Boss can grant customers extra actions: "customer_extra=view_team_kpi"
        - All decisions logged to Shadow Boss security event log (Pillar E).
    """

    skill_id:            str = "gatekeeper"
    capability_statement: str = (
        "Evaluates whether a requested action is permitted for a given user role. "
        "Enforces hard Owner vs Customer isolation. Returns ALLOW or DENY with full "
        "audit reasoning. ContextPackage-driven  no hardcoded permission lists."
    )

    allowed_roles: List[str] = ["owner", "shadow_boss"]  # Only internal calls
    pii_fields:    List[str] = []

    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="Customer attempted 3+ owner-only actions in this session.",
            condition=(
                "len([m for m in context.session_memory "
                "     if m.get('gatekeeper_verdict') == 'DENY' "
                "     and m.get('reason') == 'owner_only_action']) >= 3"
            ),
            action="NOTIFY_BOSS"
        ),
        EscalationTrigger(
            description="Unknown role presented to Gatekeeper  session anomaly.",
            condition=(
                "execution_params.get('user_role', '') not in "
                "['owner', 'customer', 'verified_customer', 'shadow_boss', 'agent']"
            ),
            action="HARD_BLOCK"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return GatekeeperInput

    #  Core gate logic 

    @skill_logger
    async def _run(
        self,
        params: GatekeeperInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the RBAC gate check pipeline.

        Decision order:
            1. Resolve dynamic permissions from ContextPackage mandate.
            2. Shadow Boss + Owner: always ALLOW (root access).
            3. Unknown/invalid role: DENY + HARD_BLOCK flag.
            4. Owner-only action  Customer request: DENY + alert.
            5. Verified Customer: check elevated permissions.
            6. Standard Customer: check base allowed set.
            7. Unrecognised action: conservative DENY.
        """
        start_ns = time.perf_counter_ns()

        action      = params.action_requested.lower().strip()
        user_role   = params.user_role.lower().strip()
        user_id     = params.user_id
        skill_id    = params.target_skill_id

        #  Step 1: Resolve dynamic permissions from ContextPackage 
        mandate                   = context_package.get_relevant_mandate("gatekeeper")
        extra_owner_actions: set  = set()
        verified_customer_uids: List[str] = []
        extra_customer_actions: set = set()

        if mandate:
            parts = dict(p.split("=", 1) for p in mandate.split(";") if "=" in p)

            # Boss can add custom protected actions
            extra_owner_actions = {
                a.strip() for a in parts.get("add_protected", "").split(",") if a.strip()
            }
            # Boss can elevate specific customers to verified tier
            verified_customer_uids = [
                u.strip() for u in parts.get("verified_customers", "").split(",") if u.strip()
            ]
            # Boss can grant specific extra actions to all customers (use carefully)
            extra_customer_actions = {
                a.strip() for a in parts.get("customer_extra", "").split(",") if a.strip()
            }

        # Merge full owner-only registry
        full_owner_only: Dict[str, str] = {
            **_DEFAULT_OWNER_ONLY_ACTIONS,
            **{a: "boss_custom_protected_action" for a in extra_owner_actions}
        }

        # Auto-elevate role if user_id is in verified list
        effective_role = user_role
        if user_id in verified_customer_uids and user_role == "customer":
            effective_role = "verified_customer"
            logger.debug(f" [Gatekeeper] {user_id} elevated to verified_customer via mandate.")

        elapsed_ms = lambda: round((time.perf_counter_ns() - start_ns) / 1_000_000, 2)

        #  Step 2: Root roles  always allow 
        if effective_role in {"owner", "shadow_boss"}:
            logger.debug(f" [Gatekeeper] ROOT ALLOW | role={effective_role} | action={action} | user={user_id}")
            return self._gate_result(
                verdict="ALLOW",
                reason="root_role_access",
                action=action,
                user_id=user_id,
                user_role=effective_role,
                skill_id=skill_id,
                elapsed_ms=elapsed_ms()
            )

        #  Step 3: Unknown / invalid role  hard block 
        if effective_role not in {"customer", "verified_customer", "agent"}:
            logger.critical(
                f" [Gatekeeper] UNKNOWN ROLE | role='{effective_role}' | "
                f"user={user_id} | action={action}"
            )
            self._alert_shadow_boss(
                event_type="unknown_role_detected",
                user_id=user_id,
                action=action,
                role=effective_role,
                context_package=context_package
            )
            return self._gate_result(
                verdict="DENY",
                reason="unknown_role",
                action=action,
                user_id=user_id,
                user_role=effective_role,
                skill_id=skill_id,
                elapsed_ms=elapsed_ms(),
                hard_block=True,
                error_code="INVALID_ROLE"
            )

        #  Step 4: Owner-only action requested by non-owner 
        if action in full_owner_only:
            block_reason = full_owner_only[action]
            logger.warning(
                f" [Gatekeeper] DENY (OWNER_ONLY) | "
                f"user={user_id} | role={effective_role} | "
                f"action={action} | reason={block_reason}"
            )
            self._alert_shadow_boss(
                event_type="owner_action_attempt",
                user_id=user_id,
                action=action,
                role=effective_role,
                context_package=context_package
            )
            return self._gate_result(
                verdict="DENY",
                reason="owner_only_action",
                action=action,
                user_id=user_id,
                user_role=effective_role,
                skill_id=skill_id,
                elapsed_ms=elapsed_ms(),
                hard_block=True,
                error_code="PERMISSION_DENIED",
                safe_message=(
                    "Main yeh kaam karne mein asmarth hoon. "
                    "Yeh action sirf Business Owner dwara kiya ja sakta hai. "
                    "Please apne account manager se sampark karein."
                )
            )

        #  Step 5: Verified Customer  check elevated permission set 
        if effective_role == "verified_customer":
            allowed = _CUSTOMER_ALLOWED_ACTIONS | _VERIFIED_CUSTOMER_EXTRA_ACTIONS | extra_customer_actions
            if action in allowed:
                logger.info(f" [Gatekeeper] ALLOW (VERIFIED_CUSTOMER) | user={user_id} | action={action}")
                return self._gate_result(
                    verdict="ALLOW",
                    reason="verified_customer_elevated",
                    action=action,
                    user_id=user_id,
                    user_role=effective_role,
                    skill_id=skill_id,
                    elapsed_ms=elapsed_ms()
                )
            # Verified Customer requesting unrecognised action
            logger.warning(
                f" [Gatekeeper] DENY (UNKNOWN_ACTION) | role={effective_role} | "
                f"user={user_id} | action={action}"
            )
            return self._gate_result(
                verdict="DENY",
                reason="action_not_in_verified_customer_scope",
                action=action,
                user_id=user_id,
                user_role=effective_role,
                skill_id=skill_id,
                elapsed_ms=elapsed_ms(),
                hard_block=False,
                error_code="ACTION_NOT_PERMITTED"
            )

        #  Step 6: Standard Customer  check base allowed set 
        allowed_for_customer = _CUSTOMER_ALLOWED_ACTIONS | extra_customer_actions
        if action in allowed_for_customer:
            logger.info(f" [Gatekeeper] ALLOW (CUSTOMER) | user={user_id} | action={action}")
            return self._gate_result(
                verdict="ALLOW",
                reason="standard_customer_scope",
                action=action,
                user_id=user_id,
                user_role=effective_role,
                skill_id=skill_id,
                elapsed_ms=elapsed_ms()
            )

        #  Step 7: Unrecognised action  conservative DENY 
        # Better to deny unknown actions than accidentally allow. Security-first.
        logger.warning(
            f" [Gatekeeper] DENY (UNRECOGNISED_ACTION) | "
            f"role={effective_role} | user={user_id} | action='{action}' | "
            f"skill={skill_id}"
        )
        return self._gate_result(
            verdict="DENY",
            reason="unrecognised_action_conservative_deny",
            action=action,
            user_id=user_id,
            user_role=effective_role,
            skill_id=skill_id,
            elapsed_ms=elapsed_ms(),
            hard_block=False,
            error_code="ACTION_UNKNOWN",
            safe_message="Is request ko process nahi kiya ja sakta. Kripaya support se sampark karein."
        )

    #  Shadow Boss Alert (Pillar E) 

    @staticmethod
    def _alert_shadow_boss(
        event_type:       str,
        user_id:          str,
        action:           str,
        role:             str,
        context_package:  ContextPackage
    ) -> None:
        """
        Fires a structured security event to Shadow Boss (Pillar E).
        Non-blocking  if Shadow Boss service is unavailable, log only.
        """
        event_payload = {
            "event_type":   event_type,
            "user_id":      user_id,
            "action":       action,
            "role":         role,
            "business_id":  context_package.business_id,
            "employee_id":  context_package.employee_id,
            "session_id":   context_package.session_id,
        }
        try:
            # Lazy import to avoid circular dependency with shadow_boss module
            from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
            shadow_boss_monitor.log_security_event(event_payload)
        except Exception as e:
            # Monitor unavailable  at minimum ensure it's in structured logs
            logger.critical(
                f" [SECURITY_EVENT] {event_type} | {event_payload} | "
                f"ShadowBoss unavailable: {e}"
            )

    #  Result Builder 

    @staticmethod
    def _gate_result(
        verdict:      str,
        reason:       str,
        action:       str,
        user_id:      str,
        user_role:    str,
        skill_id:     str,
        elapsed_ms:   float,
        hard_block:   bool  = False,
        error_code:   str   = "",
        safe_message: str   = "",
    ) -> Dict[str, Any]:
        """
        Standardised gate result consumed by routing layer and skill orchestrator.
        Hard-block = True means the request MUST NOT reach the 4b Expert Brain.
        """
        return {
            "verdict":      verdict,       # ALLOW | DENY
            "reason":       reason,
            "hard_block":   hard_block,    # True  4b Expert Brain never sees this request
            "error_code":   error_code,
            "safe_message": safe_message,  # Customer-safe refusal (Hinglish-ready)
            "audit": {
                "action":     action,
                "user_id":    user_id,
                "user_role":  user_role,
                "skill_id":   skill_id,
                "elapsed_ms": elapsed_ms,
                "gatekeeper": "gatekeeper_v2.0",
            }
        }

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

