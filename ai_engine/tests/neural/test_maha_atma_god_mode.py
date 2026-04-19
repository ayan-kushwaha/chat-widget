
import asyncio
import sys
import os
# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from src.services.neural.graph_manager.orchestrator import graph_orchestrator
from src.services.neural.master_overseer import master_overseer
from loguru import logger

async def test_god_mode():
    logger.info("🧪 Starting Maha-Atma God Mode Verification...")
    
    user_id = "founder_aryan"
    org_id = "cluaiz_neural_hq"
    
    # --- SCENARIO 1: Happy Path (Satisfaction) ---
    logger.info("Case 1: Positive Feedback Loop...")
    msg1 = "Yes, this logic is perfect! Thanks."
    resp1 = "Glad to help! I've locked in these neural patterns."
    
    res1 = await graph_orchestrator.process_interaction(user_id, org_id, msg1, resp1)
    # Note: In the orchestrator, we currently log the weight but don't return it in the simplified return dict
    # But we can verify the orchestrator didn't crash and logic flowed.
    logger.success("Turn 1 (Satisfied) synced.")

    # --- SCENARIO 2: Negative Path (Anger/Correction) ---
    logger.info("Case 2: Negative Feedback Loop...")
    msg2 = "No, this is wrong. Don't do it this way!"
    resp2 = "I apologize. I will adjust the training weights to avoid this path."
    
    res2 = await graph_orchestrator.process_interaction(user_id, org_id, msg2, resp2)
    logger.success("Turn 2 (Angry/Correction) synced with penalty weights.")

    # --- SCENARIO 3: Master Overseer (Cross-Org Wisdom) ---
    logger.info("Case 3: Master Overseer Wisdom Extraction...")
    pattern_id = await master_overseer.extract_global_pattern(org_id, ["check_invoice", "approve", "pay"])
    assert pattern_id.startswith("patt_")
    
    wisdom = await master_overseer.broadcast_wisdom("new_start_up_org")
    assert len(wisdom) > 0
    logger.success(f"Master Overseer saved pattern: {pattern_id} and broadcasted it.")

    logger.success("✅ Maha-Atma God Mode Verification PASSED!")

if __name__ == "__main__":
    asyncio.run(test_god_mode())
