"""

    LOCAL PRIVACY ENGINE  SemanticContract [I5]                            
  Pillar E (Security & Governance)                                            
                                                                              
  Role:    Advanced PII Masking with Context Awareness.                       
  Layer:   Runs Inbound (before Expert Brain) & Outbound (before User).       
                                                                              
  What it does:                                                               
    1. Wraps the core PIIMasker (RegEx based).                                
    2. Applies Tiered Masking:                                                
       - Role: customer  STRICT masking (all PII hidden).                   
       - Role: owner     LOW masking (PII visible, just tracked).            
    3. Applies Context Mandates:                                              
       - e.g., "Allow specific email for logging in."                         
    4. Logs detection statistics to the Shadow Boss monitor.                  

"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract, skill_logger
from src.services.aiskills.types import ContextPackage, EscalationTrigger
from src.core.security.pii_masker import PIIMasker


#  Input Schema 

class PrivacyInput(BaseModel):
    """
    Input schema for the Local Privacy Engine.
    """
    text:      str = Field(..., description="The text to be scanned/masked.")
    direction: str = Field(..., description="'inbound' (from user) or 'outbound' (from AI)")
    role:      str = Field(default="customer", description="The role of the user (e.g., 'customer', 'owner')")


#  Local Privacy Engine SemanticContract 

class LocalPrivacyEngine(SemanticContract):
    """
     Local Privacy Engine (Pillar E).

    Applies tiered PII masking based on user role and boss mandates.
    Returns the masked string and detection statistics.
    """

    skill_id:             str = "local_privacy_engine"
    capability_statement: str = (
        "Scans text for Personally Identifiable Information (PII) like phone numbers, "
        "emails, financial data, and applies context-aware masking based on user role."
    )

    allowed_roles:        List[str] = ["owner", "customer", "shadow_boss"]
    pii_fields:           List[str] = [] # The engine itself doesn't leak PII

    escalation_triggers: List[EscalationTrigger] = [
        EscalationTrigger(
            description="High volume of outbound PII detection implies AI might be leaking data.",
            condition="result.get('stats', {}).get('total', 0) > 3 and execution_params.get('direction') == 'outbound'",
            action="NOTIFY_BOSS"
        ),
    ]

    @property
    def input_schema(self) -> Type[BaseModel]:
        return PrivacyInput

    #  Core execution logic 

    @skill_logger
    async def _run(
        self,
        params:          PrivacyInput,
        entities:        Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the tiered PII masking logic.
        """
        start_ns  = time.perf_counter_ns()
        text      = params.text
        direction = params.direction.lower()
        role      = params.role.lower()

        # 1. Base Masking logic (always runs to at least detect)
        if not PIIMasker.has_pii(text):
            return self._verdict(text, {}, direction, role, False, _ms(start_ns))

        # 2. Determine Masking Intensity
        # Default: STRICT for customer, NONE for owner (unless mandate overrides)
        should_mask = (role != "owner")

        # 3. Apply Boss Mandates (Context Overrides)
        mandate = context_package.get_relevant_mandate("local_privacy_engine")
        if mandate:
            mandate = mandate.lower()
            if "force_mask_all=true" in mandate:
                should_mask = True
            elif "disable_masking=true" in mandate:
                should_mask = False

        # 4. Execute Masking or Tokenization
        stats = {}
        processed_text = text
        vault = {}

        if should_mask:
            if direction == "inbound":
                # Inbound traffic -> Tokenize instead of destructively masking
                processed_text, vault, stats = PIIMasker.tokenize_text(text)
            else:
                # Outbound traffic -> Destructive masking for safety
                processed_text, stats = PIIMasker.mask_text(text)
        else:
            # If not masking (e.g., Malik), just run detection for telemetry
            detection_dict = PIIMasker.detect_only(text)
            stats = {k: len(v) for k, v in detection_dict.items() if v}

        total_pii_detected = sum(stats.values()) if stats else 0
        stats["total"] = total_pii_detected

        # 5. Log telemetry dynamically
        if total_pii_detected > 0:
            log_level = "WARNING" if direction == "outbound" and should_mask else "INFO"
            action_desc = "Masked" if should_mask else "Detected (Unmasked)"
            
            log_msg = (
                f" [PrivacyEngine] {action_desc} {total_pii_detected} PII items "
                f"| role={role} | dir={direction} | stats={stats}"
            )
            
            if log_level == "WARNING":
                logger.warning(log_msg)
            else:
                logger.info(log_msg)

            # Route to Shadow Boss for system-wide auditing
            self._alert_shadow_boss(
                event_type="pii_detected" if not should_mask else "pii_masked",
                role=role,
                direction=direction,
                stats=stats,
                total=total_pii_detected
            )

        return self._verdict(
            text=processed_text,
            stats=stats,
            direction=direction,
            role=role,
            was_masked=should_mask and total_pii_detected > 0,
            elapsed_ms=_ms(start_ns),
            vault=vault
        )

    #  Shadow Boss Alert 

    @staticmethod
    def _alert_shadow_boss(event_type: str, **detail_kwargs) -> None:
        """Non-blocking alert to Shadow Boss security monitor."""
        try:
            from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
            shadow_boss_monitor.log_security_event({
                "event_type":  event_type,
                "role":        detail_kwargs.get("role", ""),
                "detail":      detail_kwargs,
            })
        except Exception as e:
            logger.debug(f" [PrivacyEngine] Shadow Boss alert failed: {e}")

    #  Verdict Builder 

    @staticmethod
    def _verdict(
        text:       str,
        stats:      Dict[str, int],
        direction:  str,
        role:       str,
        was_masked: bool,
        elapsed_ms: float,
        vault:      Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Standardised verdict.
        `processed_text` contains the final string (masked or original).
        """
        return {
            "status":         "success",
            "processed_text": text,
            "was_masked":     was_masked,
            "stats":          stats,
            "vault":          vault or {},
            "meta": {
                "direction":  direction,
                "role":       role,
                "elapsed_ms": round(elapsed_ms, 2)
            }
        }


def _ms(start_ns: int) -> float:
    return (time.perf_counter_ns() - start_ns) / 1_000_000

    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

