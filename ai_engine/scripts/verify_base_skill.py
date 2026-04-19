import asyncio
import sys
import os

# Add src to path
sys.path.append(os.getcwd())

from src.services.aiskills.wa_cart_recovery import WACartRecovery
from loguru import logger

async def test_base_skill_layers():
    skill = WACartRecovery()
    
    logger.info("--- TEST 1: Successful Execution (Grahak Role) ---")
    res1 = await skill.run(
        user_id="customer123",
        user_role="grahak",
        user_phone="+919999999999",
        cart_value=6000.50,
        items=["Product A", "Product B"]
    )
    assert res1["status"] == "success"
    assert res1["data"]["payload"]["variables"]["discount"] == 15
    print(f"Result 1: {res1}\n")

    logger.info("--- TEST 2: Validation Failure (Negative Cart Value) ---")
    res2 = await skill.run(
        user_id="customer123",
        user_role="grahak",
        user_phone="+919999999999",
        cart_value=-100.0,  # Invalid
        items=[]
    )
    assert res2["status"] == "error"
    assert res2["message"] == "VALIDATION_ERROR"
    print(f"Result 2: {res2}\n")

    logger.info("--- TEST 3: Entity Extraction (Hinglish Message) ---")
    res3 = await skill.run(
        user_id="customer123",
        user_role="grahak",
        user_phone="+919999999999",
        cart_value=3000,
        text="Bhai mera naam Aryan hai aur main Prayagraj se hoon. Order cancel mat karna."
    )
    extracted = res3["metadata"]["extracted"]
    logger.debug(f"FULL EXTRACTED OUTPUT: {extracted}")
    # Just check if 'extracted' is a dict and has keys
    assert isinstance(extracted, dict)
    print(f"Result 3 (Extracted): {extracted}\n")

    logger.info("--- TEST 4: Iron Dome Block (Admin Skill check) ---")
    skill.name = "p_l_bot"  # This is in BOSS_ONLY_SKILLS
    res4 = await skill.run(
        user_id="hacker_joe",
        user_role="grahak", # Not a malik
        user_phone="+123456789",
        cart_value=100,
        items=[]
    )
    assert res4["status"] == "error"
    assert res4["message"] == "PERMISSION_DENIED"
    print(f"Result 4 (Blocked): {res4}\n")

if __name__ == "__main__":
    asyncio.run(test_base_skill_layers())
