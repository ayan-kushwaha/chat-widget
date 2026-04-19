from typing import Dict, List, Any, Optional
from loguru import logger
import re

class HiringManager:
    """
    The 'HR' of the AI Workflow.
    Responsible for:
    1. Scanning Knowledge Base (PDFs/Text)
    2. Conducting 'Interviews' (Self-Diagnostics)
    3. Generating Initial Persona (About Me)
    """

    #  Minimum Knowledge Requirements (MKR)
    # If these keywords are missing, the agent REFUSES to work.
    MKR_RULES = {
        "sales_manager": {
            "critical_keywords": ["price", "cost", "rate", "fee", "subscription", "plan", "offer"],
            "missing_msg": "Boss, mujhe 'Price' ya 'Cost' kahin nahi dikh raha. Bina price ke main kya bechunga? Please price list upload karein."
        },
        "support_lead": {
            "critical_keywords": ["refund", "return", "policy", "contact", "email", "phone", "hours"],
            "missing_msg": "Refund policy ya Contact details missing hain. Agar customer gussa hua to main use kahan bhejun?"
        },
        "inventory_manager": {
            "critical_keywords": ["stock", "inventory", "available", "product", "sku"],
            "missing_msg": "Mujhe inventory details ya product list nahi mili. Stock track kaise karun?"
        },
        "legal_advisor": {
            "critical_keywords": ["law", "contract", "terms", "privacy", "comply"],
            "missing_msg": "Legal documents ya Terms & Conditions missing hain. Compliance check kaise karun?"
        }
    }

    @staticmethod
    def conduct_interview(agent_id: str, knowledge_text: str) -> Dict[str, Any]:
        """
        Runs a self-diagnostic test on the provided knowledge.
        Returns: { status: 'PASSED'|'FAILED', message: str, missing: [] }
        """
        text_lower = knowledge_text.lower()
        
        # 1. Check General Readiness
        if len(text_lower) < 50:
            return {
                "status": "FAILED",
                "message": "Information too short! I need detailed knowledge to work effectively.",
                "missing": ["Detailed Context"]
            }

        # 2. Check Role-Specific Rules
        rule_key = next((k for k in HiringManager.MKR_RULES.keys() if k in agent_id), None)
        
        if rule_key:
            rules = HiringManager.MKR_RULES[rule_key]
            missing = [kw for kw in rules["critical_keywords"] if kw not in text_lower]
            
            # If > 50% critical keywords are missing, FAIL.
            threshold = len(rules["critical_keywords"]) / 2
            if len(missing) > threshold:
                 return {
                    "status": "FAILED",
                    "message": rules["missing_msg"],
                    "missing": missing
                }

        return {
            "status": "PASSED",
            "message": "I have reviewed the documents. I am ready to join the team!",
            "missing": []
        }

    @staticmethod
    def draft_job_description(agent_id: str, knowledge_text: str, user_instructions: str = "") -> str:
        """
        Generates the 'About Me' section dynamically.
        """
        role_map = {
            "sales_manager": "Sales Manager",
            "support_lead": "Customer Support Lead",
            "marketing_head": "Head of Marketing",
            "executive_pa": "Chief Executive PA",
            "tech_support": "Technical Support Engineer",
            "inventory_manager": "Inventory Manager",
            "accountant": "Senior Accountant",
            "legal_advisor": "Legal Advisor",
            "content_writer": "Content Strategist",
            "appointment_setter": "Appointment Setter",
            "medical_advisor": "Medical Advisor",
            "shadow_boss": "Chief of Staff"
        }
        
        role_name = role_map.get(agent_id, "AI Specialist")
        base_bio = f"I am the {role_name} for this organization."
        
        if "price" in knowledge_text.lower():
            base_bio += " I will confidently quote prices from the provided documents."
        
        if "proactive" in user_instructions.lower():
            base_bio += " My style is proactive and result-oriented."
        else:
            base_bio += " I maintain a professional and helpful tone."
            
        return base_bio

hiring_manager = HiringManager()
