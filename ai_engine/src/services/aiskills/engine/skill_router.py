from typing import Tuple, Optional, Dict, List
from loguru import logger
import numpy as np
import time

# Define Agent Profiles for Vector Matching (Core 12 Roster)
AGENTS_REGISTRY = {
    # Dept 1: Revenue & Growth
    "sales_manager": {
        "description": "Rocky: Global Sales Closer. Handles deals, pricing, and revenue optimization.",
        "keywords": ["price", "discount", "deal", "buy", "purchase", "quote", "payment", "sales"]
    },
    "appointment_setter": {
        "description": "Amit: Scheduling orchestrator for demos and executive meetings.",
        "keywords": ["schedule", "meeting", "demo", "calendar", "book", "appointment"]
    },
    "marketing_head": {
        "description": "Zara: Growth strategist. Manages campaigns, ads, and brand performance.",
        "keywords": ["strategy", "campaign", "growth", "ads", "marketing", "viral", "brand"]
    },
    
    # Dept 2: Operations & Success
    "support_lead": {
        "description": "Sarah: Customer success lead. Handles satisfaction, complaints, and resolution.",
        "keywords": ["support", "issue", "problem", "angry", "help", "refund", "return"]
    },
    "it_commander": {
        "description": "Alex: IT Commander & UI Specialist. Navigates the site, clicks UI elements, and handles technical troubleshooting.",
        "keywords": ["navigate", "go to", "show me", "click", "search site", "scan", "bug", "error", "api", "tech"]
    },
    "inventory_manager": {
        "description": "Deepak: Logistics and stock tracking for global inventory.",
        "keywords": ["stock", "inventory", "available", "warehouse", "reorder", "product"]
    },
    
    # Dept 3: Admin & Compliance
    "executive_pa": {
        "description": "Anjali: Chief PA. Manages priority inbox, HR tasks, and executive coordination.",
        "keywords": ["priority", "inbox", "executive", "urgent", "help", "hr", "recruit", "task"]
    },
    "accountant": {
        "description": "Lakshmi: Financial controller. Billing, invoices, and payroll.",
        "keywords": ["billing", "tax", "invoice", "currency", "finance", "money", "payroll"]
    },
    "legal_advisor": {
        "description": "Vakil: Compliance, Contracts & Insurance. Handles legal safety, privacy, and medical policies.",
        "keywords": ["legal", "contract", "comply", "law", "privacy", "compliance", "terms", "insurance", "medical", "policy"]
    },
    
    # Dept 4: Specialized Intelligence
    "content_writer": {
        "description": "Kabir: Content strategist. High-conversion copy and SEO-ready text.",
        "keywords": ["write", "blog", "social", "post", "message", "format", "seo", "content"]
    },
    "shadow_boss": {
        "description": "Shadow Boss: The silent orchestrator with root access. Performance and security oversight.",
        "keywords": ["monitor", "override", "lockdown", "root", "performance", "security", "shadow"]
    }
}

class EmployeeRouter:
    """
    Routes commands to the appropriate AI Employee using SEMANTIC SEARCH.
    Sync'd with the Core 12 "Lean Workforce".
    Uses Ollama BGE-M3 via VectorStore (Pure Qdrant Architecture).
    """
    _agent_embeddings: Dict[str, np.ndarray] = {}
    _initialized = False

    @classmethod
    async def _initialize(cls):
        if cls._initialized:
            return

        logger.info(f" EmployeeRouter: Bootstrapping Core 12 Agent Embeddings via Ollama...")
        from src.core.vector_store import VectorStore
        vs = VectorStore()
        
        for agent_id, profile in AGENTS_REGISTRY.items():
            text_signature = f"{profile['description']} {' '.join(profile['keywords'])}"
            embedding = await vs.get_embedding(text_signature)
            cls._agent_embeddings[agent_id] = np.array(embedding)
            
        logger.success(f" EmployeeRouter: Local Workforce Ready ({len(AGENTS_REGISTRY)} Agents).")
        cls._initialized = True

    @staticmethod
    async def route(text: str) -> Tuple[Optional[str], float]:
        if not EmployeeRouter._initialized:
            await EmployeeRouter._initialize()

        from src.core.vector_store import VectorStore
        vs = VectorStore()
        user_embedding = np.array(await vs.get_embedding(text))
        
        best_agent = None
        highest_score = -1.0

        for agent_id, agent_vector in EmployeeRouter._agent_embeddings.items():
            # NumPy cosine similarity
            dot = np.dot(user_embedding, agent_vector)
            norm = np.linalg.norm(user_embedding) * np.linalg.norm(agent_vector)
            score = float(dot / norm) if norm > 0 else 0.0
            
            if score > highest_score:
                highest_score = score
                best_agent = agent_id

        if highest_score < 0.25:
            logger.warning(f" Low confidence routing ({highest_score:.2f})")
            return "support_lead", highest_score # Default to Sarah for safety

        return best_agent, highest_score

    @staticmethod
    def get_agent_instance(agent_id: str):
        """
        Factory to return the Class Instance for the Core 12.
        """
        try:
            if agent_id == "sales_manager":
                from .sales_manager.agent import SalesManager
                return SalesManager()
            elif agent_id == "support_lead":
                from .support_lead.agent import SupportLead
                return SupportLead()
            elif agent_id == "inventory_manager":
                from .inventory_manager.agent import InventoryManager
                return InventoryManager()
            elif agent_id == "accountant":
                from .accountant.agent import Accountant
                return Accountant()
            elif agent_id == "marketing_head":
                from .marketing_head.agent import MarketingHead
                return MarketingHead()
            elif agent_id == "it_commander" or agent_id == "alex":
                from .it_commander.agent import ITCommander
                return ITCommander()
            elif agent_id == "content_writer":
                from .content_writer.agent import ContentWriter
                return ContentWriter()
            elif agent_id == "appointment_setter":
                from .appointment_setter.agent import AppointmentSetter
                return AppointmentSetter()
            elif agent_id == "legal_advisor":
                from .legal_advisor.agent import LegalAdvisor
                return LegalAdvisor()
            elif agent_id == "executive_pa":
                from .executive_pa.agent import ExecutivePA
                return ExecutivePA()
            elif agent_id == "shadow_boss":
                from .shadow_boss.agent import ShadowBoss
                return ShadowBoss()
            
            # Default to Sarah (Support) if agent not yet fully implemented
            logger.warning(f" Agent '{agent_id}' not in Core 12. Using SupportLead fallback.")
            from .support_lead.agent import SupportLead
            return SupportLead()
        except Exception as e:
            logger.error(f" Failed to instantiate agent {agent_id}: {e}")
            return None
