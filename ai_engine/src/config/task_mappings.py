"""
Master AI Task Mapping Configuration
====================================
Maps specific internal AI tasks to their default billing model keys.
These model keys must match the ones defined in the Backend's `model_pricing.config.ts`.
"""

from enum import Enum
from typing import Dict

class TaskType(Enum):
    # Chat & Interaction
    CORE_CHAT = "CORE_CHAT"
    WORKFORCE_HIRE = "WORKFORCE_HIRE"
    ONBOARDING = "ONBOARDING"
    PSYCHOLOGY = "PSYCHOLOGY"
    SECURITY = "SECURITY"
    
    # Core Infrastructure (Free/Local preferred)
    CHUNK_SUMMARY = "CHUNK_SUMMARY"          # Indexer (base.py)
    NEURAL_NAVIGATOR = "NEURAL_NAVIGATOR"      # page index traversal
    SHADOW_BOSS = "SHADOW_BOSS"              # High-level gatekeeper
    LOCAL_ROUTER_FAST = "LOCAL_ROUTER_FAST"  # local_llm_router fast classify
    
    # High-quality Metadata
    DOC_METADATA = "DOC_METADATA"            # doc_service title/tags  Knowledge Base
    LOCAL_ROUTER_DEEP = "LOCAL_ROUTER_DEEP"  # deep reasoning 


#  Task to Backend Billing Key Mapping (Default)
DEFAULT_TASK_MAPPING: Dict[TaskType, str] = {
    TaskType.CORE_CHAT:         "gemini-2.0-flash-lite-001",
    TaskType.WORKFORCE_HIRE:    "gemini-2.0-flash-lite-001",
    TaskType.ONBOARDING:        "gemini-2.0-flash-lite-001",
    TaskType.PSYCHOLOGY:        "gemini-2.0-flash-lite-001",
    TaskType.SECURITY:          "gemini-2.0-flash-lite-001",
    TaskType.DOC_METADATA:      "gemini-2.0-flash-lite-001",
    TaskType.LOCAL_ROUTER_DEEP: "gemini-2.0-flash-lite-001",
    
    # Fast/Local tasks
    TaskType.CHUNK_SUMMARY:     "qwen3.5:0.8b",
    TaskType.NEURAL_NAVIGATOR:  "qwen3.5:0.8b",
    TaskType.SHADOW_BOSS:       "qwen3.5:0.8b",
    TaskType.LOCAL_ROUTER_FAST: "qwen3.5:0.8b",
}
