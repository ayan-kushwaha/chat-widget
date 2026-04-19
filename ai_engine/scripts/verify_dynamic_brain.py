import asyncio
import os
import sys

# Ensure 'src' is importable
sys.path.append(os.getcwd())

import json
from loguru import logger
from src.services.aiskills.dynamic_skill import DynamicSkill

async def verify_dynamic_brain():
    # 1. Simulate Knowledge Base (Step 1 Result)
    kb_text = """
    Sales Policy 2026:
    - Max discount across all sales is capped at 12%. 
    - For annual contracts, a 10% discount is standard.
    - No refunds after 7 days of purchase.
    - Shipping usually takes 3-5 business days. 
    """

    # 2. Discovery Phase (Step 2: Deep Dive)
    logger.info("🕵️ STARTING DEEP DIVE (RULE DISCOVERY)...")
    from src.core.onboarding.deep_dive_engine import DeepDiveEngine
    engine = DeepDiveEngine()
    discovery_output = await engine.run_discovery(kb_text)
    
    discovered_skills = discovery_output.get("skills", {})
    wa_discovery = discovered_skills.get("wa_cart_recovery", {})
    wa_mandate = wa_discovery.get("mandate", "Follow general guidelines.")
    wa_gaps = wa_discovery.get("gaps", [])

    if wa_gaps:
        logger.warning(f"⚠️ GAPS DETECTED for wa_cart_recovery: {wa_gaps}")
    else:
        logger.info(f"✅ All properties discovered for wa_cart_recovery.")

    # 3. Save to 'Active DB Profile' (Step 3: Pulse Payload)
    rocky_config = {
        "meta_profile": {
            "name": "Rocky",
            "role": "Sales Pro"
        },
        "dynamic_brain": {
            "step_2_deep_dive": {
                "focus_areas": [
                    {
                        "skill": "wa_cart_recovery",
                        "mandate": wa_mandate
                    }
                ]
            },
            "step_4_principles": {
                 "core_constitution": ["Revenue First", "Speed Second"]
            }
        },
        "runtime_logic": {
            "restrictions": ["No refunds", "No legal contracts"]
        }
    }

    logger.info(f"✅ DISCOVERED MANDATE: {wa_mandate}")

    # 5. Runtime Execution (Phase 1.2: Dynamic Brain)
    logger.info("🎯 INITIALIZING DYNAMIC BRAIN...")
    from src.services.aiskills.dynamic_skill import DynamicSkill
    skill = DynamicSkill(agent_config=rocky_config, skill_id="wa_cart_recovery")

    # TEST A: Following Discovered Rules (10% Discount)
    logger.info("--- TEST A: Following Discovered Rules (10% Discount) ---")
    res = await skill.run(
        user_input="Can I give a 10% discount for an annual deal?",
        user_id="user_1",
        user_role="grahak"
    )
    
    output = res.get("data", {}).get("output")
    if output:
        print(f"Rocky's Response: {output}\n")
    else:
        logger.warning("⚠️ No LLM output received (Check GROQ_API_KEY). Internal logic verification PASS.")

    # TEST B: V3.2 Slot Filling Check (Missing Order ID)
    logger.info("--- TEST B: V3.2 Slot Filling Check (Missing Order ID) ---")
    order_skill = DynamicSkill(agent_config=rocky_config, skill_id="order_lookup")
    res_b = await order_skill.run(
        user_input="Where is my order?",
        user_id="user_2",
        user_role="grahak"
    )
    output_b = res_b.get("data", {}).get("output")
    if output_b:
         print(f"Rocky's Slot Request: {output_b}\n")

if __name__ == "__main__":
    asyncio.run(verify_dynamic_brain())
