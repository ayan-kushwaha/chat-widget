import asyncio
import sys
import os
from loguru import logger

# Add src to path
sys.path.append(os.getcwd())

from src.services.skills.registry import SkillRegistry
from src.services.skills.loader import bootstrap_skills
from src.services.skills.factory import SkillFactory

async def run_verification():
    logger.info("🧪 Starting Skill Hub Verification...")
    
    # 1. Bootstrap
    bootstrap_skills()
    
    # 2. Test Semantic Discovery
    queries = [
        ("Amit ka 500 ka bill bana do", "invoice_generation"),
        ("Send this report to boss@gmail.com", "email_service"),
        ("Customer kaisa feel kar raha hai?", "sentiment_analysis")
    ]
    
    logger.info("🔍 Testing Intent Discovery...")
    for query, expected_id in queries:
        skill_id, score = SkillRegistry.find_best_skill(query)
        status = "✅" if skill_id == expected_id else "❌"
        logger.info(f"{status} Query: '{query}' -> Match: {skill_id} (Score: {score:.2f})")

    # 3. Test NER Extraction (Manual Mock Check)
    from src.services.aiemployees.base_employee import BaseEmployee
    
    class TestEmployee(BaseEmployee):
        def specific_task(self): pass
        
    emp = TestEmployee("Rocky", "Sales Manager", "sales")
    
    logger.info("🧠 Testing Argument Extraction...")
    test_ner = "Create an invoice for Reliance Industries for 5000"
    params = await emp._extract_params(test_ner, {"name": "invoice_generation"})
    if params.get('client_name') == "Reliance Industries":
        logger.success("✅ NER successfully extracted ORG 'Reliance Industries'")
    else:
        logger.warning(f"⚠️ NER returned: {params}")

    # 4. Test Tool Execution (Invoice)
    logger.info("📄 Testing Tool Execution (Invoice Gen)...")
    invoice_skill = SkillRegistry.get_skill_instance("invoice_generation")
    result = await invoice_skill.run(
        client_name="Aryan Tech",
        items=[{"name": "AI Consulting", "price": 5000, "qty": 1}],
        invoice_no="TEST-001"
    )
    
    if result.get('status') == "success":
        logger.success(f"✅ Invoice generated at: {result.get('file_path')}")
    else:
        logger.error(f"❌ Invoice failed: {result.get('message')}")

    logger.success("🎉 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(run_verification())
