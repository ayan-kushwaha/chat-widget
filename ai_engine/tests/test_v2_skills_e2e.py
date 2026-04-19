import asyncio
from src.services.aiskills.loader import bootstrap_skills
from src.services.aiskills.registry import SkillRegistry
from src.services.aiskills.contracts.types import ContextPackage, BusinessDNA
from src.utils.logger import logger

async def test_v2_skills_e2e():
    logger.info("🚀 Starting E2E Skill Verification...")
    await bootstrap_skills()
    
    # 1. Setup Mock Context
    dna = BusinessDNA(
        industry_cluster="fashion_retail",
        language_preference="hinglish",
        platform="whatsapp_api"
    )
    context = ContextPackage(
        business_dna=dna,
        business_id="test_fashion_store",
        kb_chunks=[{
            "source": "policy.txt",
            "chunk": "For cart recovery, offer 10% discount to all users.",
            "score": 0.95
        }]
    )

    # 2. Test WA Cart Recovery (S1)
    logger.info("🧪 Testing WA Cart Recovery...")
    skill = SkillRegistry.get_instance("wa_cart_recovery")
    if skill:
        result = await skill.run(
            context_package=context,
            user_phone="+919999999999",
            cart_value=2500,
            items=["Silk Saree", "Gold Bangle"]
        )
        logger.success(f"S1 Result: {result['data']['recovery_message']}")
        assert "10% discount" in result['data']['recovery_message']

    # 3. Test Upsell Engine (S5)
    logger.info("🧪 Testing Upsell Engine...")
    skill = SkillRegistry.get_instance("upsell_engine")
    if skill:
        # Note: This will try to search Qdrant, might return "NO_RECOMMENDATIONS" if collection empty
        result = await skill.run(
            context_package=context,
            current_items=["iPhone 15"]
        )
        logger.info(f"S5 Result: {result['data']['message']} -> {result['data']['status']}")

    # 4. Test Conflict De-escalator (X5)
    logger.info("🧪 Testing Conflict De-escalator...")
    skill = SkillRegistry.get_instance("conflict_deescalator")
    if skill:
        result = await skill.run(
            context_package=context,
            user_sentiment=-0.8,
            last_user_message="I hate this service, my order is late!"
        )
        logger.success(f"X5 Result: {result['data']['response']}")
        assert "Hum samajh sakte hain" in result['data']['response']

if __name__ == "__main__":
    asyncio.run(test_v2_skills_e2e())
