"""
 PIIShield  Cluaiz SpaCy-powered PII Processor
====================================================
Mandatory Day 1 integration into BaseSkill pipeline.

Two-pass protection:
  Pass 1 (INPUT):  Scan user message before it reaches the LLM.
                   Flag PII entities  do NOT block, just annotate.
  Pass 2 (OUTPUT): Scan skill execution result before sending to user.
                   MASK any PII found in the output string.

Entities masked:
  - Phone numbers (PHONE, GPE patterns)
  - Email addresses (EMAIL via regex)
  - Aadhaar / PAN numbers (Indian PII  regex)
  - Credit card digits (regex)
  - Customer name (PERSON entity)
  - Physical address (LOC, GPE entity)

Compliance: DPDP Act 2023 (India) + GDPR (EU)
            As required by global_config.json  compliance_framework.pii_shield
"""

import re
import spacy
from typing import Dict, Any, List, Tuple
from loguru import logger

#  SpaCy model load (multilingual, small, fast) 
# Falls back to en_core_web_sm if multilingual not available
def _load_spacy_model():
    for model in ("xx_sent_ud_sm", "en_core_web_sm"):
        try:
            return spacy.load(model)
        except OSError:
            continue
    logger.warning(" [PIIShield] No SpaCy model found. Regex-only PII mode active.")
    return None

_nlp = _load_spacy_model()

#  Regex patterns for Indian + Global PII 
_PII_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("AADHAAR",   re.compile(r"\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b")),
    ("PAN",       re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")),
    ("PHONE_IN",  re.compile(r"\b(?:\+91|0)?[6-9][0-9]{9}\b")),
    ("EMAIL",     re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b")),
    ("CARD",      re.compile(r"\b(?:\d[ \-]?){13,16}\b")),
    ("UPI",       re.compile(r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b")),
]

# Mask token per PII type
_MASK_MAP = {
    "AADHAAR":  "[AADHAAR_MASKED]",
    "PAN":      "[PAN_MASKED]",
    "PHONE_IN": "[PHONE_MASKED]",
    "EMAIL":    "[EMAIL_MASKED]",
    "CARD":     "[CARD_MASKED]",
    "UPI":      "[UPI_MASKED]",
    "PERSON":   "[NAME_MASKED]",
    "LOC":      "[LOCATION_MASKED]",
    "GPE":      "[LOCATION_MASKED]",
}


class PIIShield:
    """
    SpaCy + Regex dual-layer PII processor.
    Used in BaseSkill at both input scan and output masking stages.
    """

    @classmethod
    def scan_input(cls, text: str) -> Dict[str, Any]:
        """
        Pass 1  INPUT scan (before LLM call).
        Does NOT modify the text. Returns annotations only.

        Returns:
            {
                "original_text": str,
                "pii_found": bool,
                "pii_entities": [{"type": str, "value": str, "start": int, "end": int}],
                "risk_level": "NONE" | "LOW" | "HIGH"
            }
        """
        entities = []

        # Regex scan
        for label, pattern in _PII_PATTERNS:
            for match in pattern.finditer(text):
                entities.append({
                    "type": label,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })

        # SpaCy NER scan (if model available)
        if _nlp:
            doc = _nlp(text)
            for ent in doc.ents:
                if ent.label_ in ("PERSON", "LOC", "GPE"):
                    entities.append({
                        "type": ent.label_,
                        "value": ent.text,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })

        pii_found = len(entities) > 0
        high_risk_types = {"AADHAAR", "PAN", "CARD"}
        risk_level = "NONE"
        if pii_found:
            risk_level = "HIGH" if any(e["type"] in high_risk_types for e in entities) else "LOW"

        if pii_found:
            logger.warning(
                f" [PIIShield] INPUT scan: {len(entities)} PII entities found "
                f"| Risk: {risk_level} | Types: {[e['type'] for e in entities]}"
            )

        return {
            "original_text": text,
            "pii_found": pii_found,
            "pii_entities": entities,
            "risk_level": risk_level
        }

    @classmethod
    def mask_output(cls, data: Any, skill_pii_fields: List[str] = None) -> Any:
        """
        Pass 2  OUTPUT masking (after skill execution).
        Recursively traverses dict/list/str and replaces PII with mask tokens.

        Args:
            data: The skill output (dict, list, or str)
            skill_pii_fields: Optional list of specific field names to also mask
                              (from the contract's pii_fields list)

        Returns:
            Same structure as input but with PII masked.
        """
        if isinstance(data, str):
            return cls._mask_string(data)
        elif isinstance(data, dict):
            return {
                k: cls._mask_field(k, v, skill_pii_fields or [])
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [cls.mask_output(item, skill_pii_fields) for item in data]
        return data

    @classmethod
    def _mask_field(cls, key: str, value: Any, pii_fields: List[str]) -> Any:
        """Mask a specific field if it's in pii_fields, or recursively scan strings."""
        if key in pii_fields and isinstance(value, str):
            logger.debug(f" [PIIShield] Masking field '{key}' (contract-defined PII)")
            return "[MASKED]"
        return cls.mask_output(value, pii_fields)

    @classmethod
    def _mask_string(cls, text: str) -> str:
        """Apply all regex patterns to mask PII in a string."""
        for label, pattern in _PII_PATTERNS:
            mask_token = _MASK_MAP.get(label, "[MASKED]")
            text = pattern.sub(mask_token, text)

        # SpaCy entity masking
        if _nlp:
            doc = _nlp(text)
            # Process in reverse to preserve character positions
            for ent in reversed(doc.ents):
                if ent.label_ in _MASK_MAP:
                    mask_token = _MASK_MAP[ent.label_]
                    text = text[:ent.start_char] + mask_token + text[ent.end_char:]

        return text
