from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class BusinessDNA(BaseModel):
    """ Business DNA  Phase 1 Context Inference"""
    industry_cluster:    str = Field(default="generic", description="e.g., retail, saas, lawyer")
    market_tier:         str = Field(default="local_smb", description="local_smb | regional | enterprise")
    language_preference: str = Field(default="english", description="english | hindi | hinglish")
    regulatory_env:      str = Field(default="global", description="india_gst | eu_gdpr | global")
    pricing_model:       str = Field(default="flat_fee", description="margin_based | flat_fee | subscription")
    platform:            str = Field(default="generic_web", description="whatsapp_api | shopify | custom_web")

class EscalationTrigger(BaseModel):
    """ Escalation Trigger for Semantic Contracts"""
    description: str
    condition:   str
    action:      str = "NOTIFY_BOSS"

class ContextPackage(BaseModel):
    """ ContextPackage  The complete bucket of context for a skill execution."""
    business_dna:    BusinessDNA = Field(default_factory=BusinessDNA)
    kb_chunks:       List[Dict[str, Any]] = Field(default_factory=list)
    boss_mandates:   List[Dict[str, str]] = Field(default_factory=list)
    session_memory:  Dict[str, Any] = Field(default_factory=dict)
    temporal_anchor: str = Field(default="", description="The Global Time Anchor")
    employee_id:     str = Field(default="unknown")
    business_id:     str = Field(default="default")
    session_id:      str = Field(default="default")

    def get_relevant_mandate(self, skill_id: str) -> Optional[str]:
        """Fetch custom mandates for a specific skill from the mandates list."""
        for m in self.boss_mandates:
            if m.get("skill") == skill_id:
                return m.get("mandate")
        return None

    def get_kb_summary(self) -> str:
        """Returns a summarized string of knowledge base chunks."""
        if not self.kb_chunks:
            return "No relevant knowledge base entries found."
        
        summary = []
        for i, chunk in enumerate(self.kb_chunks[:5]):
            content = chunk.get("content", "")[:200]
            summary.append(f"[{i+1}] {content}")
        
        return "\n".join(summary)
