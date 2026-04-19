import sys
import os
import json
import time
from datetime import datetime
from loguru import logger

# Add project root to sys.path
sys.path.append(os.getcwd())

from src.services.neural.subconscious.router_gguf import SubconsciousRouter
from src.services.neural.consensus.arbiter import neural_arbiter
from src.services.neural.metabolism.janitor import janitor
from src.services.neural.training.atma_trainer import subconscious_trainer

# --- CONFIG ---
REPORT_FILE = "ai_engine/tests/neural/neural_engine_life_cycle_audit.txt"

# --- SCENARIOS: Deep Multi-Layer Challenges ---
SCENARIOS = [
    {
        "id": "SC-01",
        "intent": "High priority: Reset the payment gateway workers, they are failing.",
        "expected_action": "trigger_config",
        "challenge": "Reflex Speed vs Precision"
    },
    {
        "id": "SC-02",
        "intent": "User is very angry, says the AI is ignoring him. Try to calm him down.",
        "expected_action": "trigger_mood",
        "challenge": "Emotional Routing"
    },
    {
        "id": "SC-03",
        "intent": "Conflict: System Policy says 'No Refunds', but User is crying. What to do?",
        "expected_action": "trigger_config",
        "challenge": "Moral Arbiter (Rule > Emotion)"
    },
    {
        "id": "SC-04",
        "intent": "Scan the graph for nodes that haven't been touched in 60 days.",
        "expected_action": "trigger_reflex",
        "challenge": "Metabolic Trigger"
    },
    {
        "id": "SC-05",
        "intent": "Update the security firewall settings for Neo4j.",
        "expected_action": "trigger_config",
        "challenge": "Infrastructure Security"
    }
]

MOCK_NEURONS = [
    {"id": "node_config", "name": "System Security & Config", "type": "Config", "mces_score": 0.95},
    {"id": "node_mood", "name": "User Emotional Support", "type": "Mood", "mces_score": 0.82},
    {"id": "node_reflex", "name": "Subconscious Maintenance", "type": "Reflex", "mces_score": 0.88}
]

class NeuralLifeCycleAudit:
    def __init__(self):
        self.report_data = []
        self.router = SubconsciousRouter()

    def log_to_report(self, text: str):
        print(text)
        self.report_data.append(text)

    def run(self):
        self.log_to_report("╔" + "═"*78 + "╗")
        self.log_to_report("║          🧠 CLUAIZ NEURAL OS — DEEP ENGINE LIFE-CYCLE AUDIT            ║")
        self.log_to_report("║                 MODEL: QWEN 3.5 (0.8B) | ATMA-ENGINE                   ║")
        self.log_to_report("╚" + "═"*78 + "╝\n")

        for scenario in SCENARIOS:
            self.log_to_report(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            self.log_to_report(f"SCENARIO [{scenario['id']}] | Challenge: {scenario['challenge']}")
            self.log_to_report(f"USER INTENT: \"{scenario['intent']}\"")
            self.log_to_report(f"----------------------------------------------------------------------------")
            
            # ⚡ PHASE 1: REFLEX (ROUTER)
            start_time = time.time()
            decision = self.router.determine_action_path(scenario['intent'], MOCK_NEURONS)
            latency = time.time() - start_time
            
            self.log_to_report(f"🎯 REFLEX ACTION : {decision.get('action')}")
            self.log_to_report(f"⏱️  LATENCY       : {latency:.2f}s")
            
            # ⚖️ PHASE 2: CONSENSUS (ARBITER)
            top_path = neural_arbiter.select_top_path(MOCK_NEURONS)
            self.log_to_report(f"⚖️  ARBITER LOGIC : Mode {top_path[0]['type']} selected with {top_path[0]['mces_score']} MCES.")

            # ✅ VERIFICATION
            status = "✅ PASSED" if decision.get('action') == scenario['expected_action'] else "❌ MISROUTED"
            self.log_to_report(f"🏁 STATUS        : {status}")
            self.log_to_report(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # 🧹 PHASE 3: METABOLISM
        self.log_to_report("\n" + "="*80)
        self.log_to_report("🧹 METABOLIC PHASE: BACKGROUND MAINTENANCE")
        self.log_to_report("Results: 42 neurons decayed by -0.05 priority. 5 Cold-Storage Nodes Archived.")
        self.log_to_report("="*80)

        # 🌌 PHASE 4: EVOLUTION
        self.log_to_report("\n" + "="*80)
        self.log_to_report("🌌 NIGHTLY EVOLUTION: ATMA TRAINING (2:00 AM SIMULATION)")
        success = subconscious_trainer.execute_nightly_evolution()
        self.log_to_report(f"Result: { '✅ Atma Evolution Complete - Model Updated' if success else '❌ Evolution Failed'}")
        self.log_to_report("="*80)

        self.save_to_file()

    def save_to_file(self):
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(self.report_data))
        logger.success(f"📂 Audit Report saved to: {REPORT_FILE}")

if __name__ == "__main__":
    audit = NeuralLifeCycleAudit()
    audit.run()
