"""
 BaseSkill V2  Upgraded with PIIShield + ContextPackage
============================================================
V2 Changes (vs V1):
  1. PIIShield integrated at TWO points in pipeline:
       - Pass 1: Input scan BEFORE LLM (flag PII, annotate)
       - Pass 2: Output mask AFTER execution (mask PII in response)
  2. context_package: ContextPackage now flows through _execute()  _run()
       - Carries BusinessDNA + KB chunks + Boss mandates + Session memory
       - _run() implementations read rules from context_package, NOT hardcoded
  3. platform detection removed from BaseSkill (moved to BusinessDNA in context)
  4. Escalation check integrated before execution
  5. Compatible with both old BaseSkill subclasses AND new SemanticContract subclasses
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Type, List, TYPE_CHECKING
from pydantic import BaseModel, ValidationError
from loguru import logger
import functools
import time

if TYPE_CHECKING:
    from src.services.aiskills.types import (
        BusinessDNA,
        ContextPackage,
        EscalationTrigger
    )

from src.core.security.rate_limiter import get_rate_limiter
from src.core.security.gatekeeper import gatekeeper
from src.utils.entity_extractor import EntityExtractor


#  Decorators 

def skill_logger(func):
    """Decorator: log skill execution with timing."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        skill = args[0]
        skill_id = getattr(skill, "skill_id", None) or getattr(skill, "name", "unknown")
        logger.info(f" [SKILL] Executing: {skill_id}")
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = round(time.time() - start_time, 3)
            logger.success(f" [SKILL] {skill_id} completed in {duration}s")
            return result
        except Exception as e:
            logger.error(f" [SKILL] {skill_id} failed: {str(e)}")
            raise e
    return wrapper


def pii_guard_v2(func):
    """
    V2 PII Guard: Uses PIIShield.mask_output() with skill's pii_fields list.
    Replaces the old pii_guard decorator that used PIIMasker directly.
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        result = await func(*args, **kwargs)
        skill = args[0]
        # V2: Late import PIIShield to break circular dependencies
        from src.services.aiskills.shared.pii_shield import PIIShield
        pii_fields = getattr(skill, "pii_fields", [])
        if isinstance(result, dict):
            result = PIIShield.mask_output(result, skill_pii_fields=pii_fields)
        return result
    return wrapper


#  BaseSkill V2 

class BaseSkill(ABC):
    """
     Cluaiz BaseSkill V2  The Standard Assembly Line

    Pipeline (in order):
        0. PIIShield INPUT scan   flag PII in user message (annotate, don't block)
        1. Pydantic validation    validate parameters against input_schema
        2. SpaCy entity extract   extract entities from user message
        3. Escalation check       evaluate context-aware triggers (SemanticContract only)
        4. _run() execution       actual business logic with full ContextPackage
        5. PIIShield OUTPUT mask  mask any PII in execution result (@pii_guard_v2)
        6. Gatekeeper check       Malik vs Grahak RBAC (@gatekeeper)
        7. Audit log              record execution (@skill_logger)

    Compatible with:
        - New SemanticContract subclasses (V2 preferred)
        - Old BaseSkill direct subclasses (V1 backwards compat)
    """

    def __init__(self, name: str = "", description: str = "", version: str = "2.0.0"):
        # V1 compat: name/description passed in __init__
        # V2 (SemanticContract): name comes from skill_id property
        self._name_override = name
        self._description_override = description
        self.version = version
        self.rate_limit = 10

    @property
    def name(self) -> str:
        """V1 compat: returns name. V2 uses skill_id."""
        return self._name_override or getattr(self, "skill_id", "unknown_skill")

    @property
    @abstractmethod
    def input_schema(self) -> Type[BaseModel]:
        """Pydantic model for input validation."""
        pass

    @property
    def metadata(self) -> Dict[str, Any]:
        return {
            "name":         self.name,
            "description":  self._description_override or getattr(self, "capability_statement", ""),
            "version":      self.version,
            "input_schema": self.input_schema.model_json_schema() if self.input_schema else {}
        }

    #  Public entry point 

    async def run(
        self,
        context_package: Optional[ContextPackage] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        V2 entry point. Accepts ContextPackage as first class citizen.
        Falls back to empty ContextPackage if not provided (V1 compat).
        """
        from src.services.aiskills.types import ContextPackage
        if context_package is None:
            logger.warning(
                f" [BaseSkill] '{self.name}' called WITHOUT ContextPackage. "
                f"Skill will run with zero business context. "
                f"Pass context_package for full V2 behaviour."
            )
            context_package = ContextPackage()

        #  Pass 0: PIIShield INPUT scan 
        from src.services.aiskills.shared.pii_shield import PIIShield
        combined_input = " ".join([str(v) for v in kwargs.values() if isinstance(v, str)])
        if combined_input:
            pii_scan = PIIShield.scan_input(combined_input)
            if pii_scan["risk_level"] == "HIGH":
                logger.warning(
                    f" [PIIShield] HIGH-risk PII in input for skill '{self.name}'. "
                    f"Entities: {[e['type'] for e in pii_scan['pii_entities']]}"
                )
                # Annotate kwargs with PII scan result for _run() awareness
                kwargs["_pii_scan"] = pii_scan

        return await self._execute(context_package=context_package, **kwargs)

    #  Execution pipeline (decorators applied inside-out) 

    @gatekeeper           # Layer: Malik vs Grahak RBAC
    @pii_guard_v2         # Layer: PIIShield OUTPUT mask
    @skill_logger         # Layer: Audit logging
    async def _execute(
        self,
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """Internal pipeline  decorators handle security layers."""

        #  1. Pydantic Validation 
        try:
            params = self.input_schema(**kwargs)
        except ValidationError as e:
            logger.warning(f" Validation Failed for {self.name}: {e.json()}")
            return {
                "status":  "error",
                "message": "VALIDATION_ERROR",
                "detail":  "The provided parameters do not match the skill schema.",
                "errors":  e.errors()
            }

        #  2. SpaCy Entity Extraction 
        combined_text = " ".join([str(v) for v in kwargs.values() if isinstance(v, str)])
        extracted_entities = EntityExtractor.extract(combined_text)

        #  3. Escalation Check (SemanticContract only) 
        if hasattr(self, "check_escalation") and hasattr(self, "escalation_triggers"):
            triggered = self.check_escalation(
                context_package=context_package,
                execution_params=kwargs
            )
            if triggered:
                return {
                    "status":       "escalation_required",
                    "skill":        self.name,
                    "trigger":      triggered.description,
                    "action":       triggered.action,
                    "message":      f" This action needs Boss approval: {triggered.description}",
                    "context_hint": context_package.get_kb_summary()
                }

        #  4. Skill Execution 
        try:
            result = await self._run(
                params=params,
                entities=extracted_entities,
                context_package=context_package,
                **kwargs
            )
            return {
                "status":   "success",
                "skill":    self.name,
                "data":     result,
                "metadata": {
                    "entities_extracted": extracted_entities,
                    "business_dna":       context_package.business_dna.__dict__,
                    "kb_chunks_used":     len(context_package.kb_chunks)
                }
            }
        except Exception as e:
            logger.error(f"Execution Error in {self.name}: {str(e)}")
            return {
                "status":  "error",
                "message": f"Skill execution failed: {str(e)}",
                "skill":   self.name
            }

    #  Abstract: implemented by each skill 

    @abstractmethod
    async def _run(
        self,
        params: BaseModel,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """Implemented by child skills."""
        pass


#  SemanticContract  The V2 Skill Base 

class SemanticContract(BaseSkill):
    """
    V2 base class for all Cluaiz skills.
    Inherits from BaseSkill for standard execution pipeline & dynamic discovery.

    Subclass this instead of writing JSON manifests.
    """

    def __init__(self):
        # Initialize BaseSkill with name derived from skill_id
        super().__init__(name=self.skill_id)

    @property
    @abstractmethod
    def capability_statement(self) -> str:
        """
        Plain language description of what this skill CAN DO.
        Embedded for semantic routing.
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def input_schema(self) -> Type[BaseModel]:
        """Pydantic model for input validation."""
        raise NotImplementedError

    @abstractmethod
    async def _run(
        self,
        params: BaseModel,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """The actual business logic."""
        raise NotImplementedError

    #  V2 Metadata & Utilities 

    allowed_roles: List[str] = ["customer", "boss"]
    escalation_triggers: List[EscalationTrigger] = []
    pii_fields: List[str] = []

    @property
    def skill_id(self) -> str:
        """Auto-derive skill_id from class name. e.g. OrderLookupContract -> order_lookup."""
        import re
        name = type(self).__name__
        name = name.replace("Contract", "").replace("Skill", "")
        return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower().strip("_")

    @property
    def metadata(self) -> Dict[str, Any]:
        """Returns skill metadata for Registry & Discovery."""
        return {
            "skill_id":            self.skill_id,
            "capability_statement": self.capability_statement,
            "allowed_roles":       self.allowed_roles,
            "pii_fields":          self.pii_fields,
            "input_schema":        self.input_schema.model_json_schema() if self.input_schema else {}
        }

    def check_escalation(
        self,
        context_package: ContextPackage,
        execution_params: Dict[str, Any]
    ) -> Optional[EscalationTrigger]:
        """Evaluate escalation triggers against context."""
        for trigger in self.escalation_triggers:
            try:
                should_escalate = eval(
                    trigger.condition,
                    {"__builtins__": {"float": float, "int": int, "str": str, "len": len}},
                    {"context": context_package, "execution_params": execution_params}
                )
                if should_escalate:
                    return trigger
            except Exception as e:
                logger.error(f" [EscalationCheck] Evaluation failed for {self.skill_id}: {e}")
        return None

    def __repr__(self) -> str:
        return f"<SemanticContract: {self.skill_id} | roles={self.allowed_roles}>"
