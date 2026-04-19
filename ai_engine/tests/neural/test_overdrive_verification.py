
import sys
import os
# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from src.services.neural.training.atma_trainer import subconscious_trainer
from loguru import logger

def test_logic():
    logger.info("🧪 Starting Overdrive Logic Verification...")
    
    # CASE 1: Normal path threshold not met
    # 500 nodes, 30h since last train, 10h idle
    assert subconscious_trainer.is_evolution_ready("org1", 500, 30, 10) == False
    
    # CASE 2: Normal path cooldown not met
    # 2000 nodes, 10h since last train, 10h idle
    assert subconscious_trainer.is_evolution_ready("org2", 2000, 10, 10) == False

    # CASE 3: Normal path SUCCESS
    # 2000 nodes, 25h since last train, 10h idle
    assert subconscious_trainer.is_evolution_ready("org3", 2000, 25, 10) == True

    # CASE 4: Overdrive path SUCCESS (Early trigger)
    # 12000 nodes, 8h since last train, 10h idle
    assert subconscious_trainer.is_evolution_ready("org4", 12000, 8, 10) == True

    # CASE 5: System NOT idle (Mandatory guard)
    # 15000 nodes, 30h since last train, 2h idle
    assert subconscious_trainer.is_evolution_ready("org5", 15000, 30, 2) == False

    # CASE 6: Overdrive cooldown not met
    # 15000 nodes, 4h since last train, 10h idle
    assert subconscious_trainer.is_evolution_ready("org6", 15000, 4, 10) == False

    logger.success("✅ ALL Logic Cases Passed!")

if __name__ == "__main__":
    test_logic()
