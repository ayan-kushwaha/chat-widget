import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from unittest.mock import MagicMock

# --- Mock Dependencies Start ---
# Mock `dateparser` entirely so it doesn't break imports
sys.modules["dateparser"] = MagicMock()

# Mock `src.services.aiskills.loader`
loader_mock = MagicMock()
loader_mock.bootstrap_skills = MagicMock()
sys.modules["src.services.aiskills.loader"] = loader_mock

# Mock `src.services.aiskills.factory` if needed
sys.modules["src.services.aiskills.factory"] = MagicMock()
# --- Mock Dependencies End ---

from src.services.hiring.knowledge_auditor import KnowledgeAuditor
from src.services.hiring.simulation_service import SimulationService
from src.services.aiemployees.base_employee import BaseEmployee

# Mock Agent for Simulation
class MockAgent(BaseEmployee):
    def __init__(self):
        # Skip super init to avoid loading heavy models/persona
        self.name = "Rocky_Mock"
        self.role = "Sales Manager"
        self.folder_name = "sales_manager"
        self.business_context = {}
        
    async def execute(self, message, context):
        # Simple mock logic
        if "discount" in message.lower():
            return {"reply": "Sorry boss, no discount. Price is fixed."}
        return {"reply": "The price is $1000."}

    def specific_task(self):
        return "I am a mock agent for testing."

async def test_knowledge_auditor():
    print("\n--- Testing Layer 1: Knowledge Auditor ---")
    auditor = KnowledgeAuditor()
    
    # Test 1: Keyword Match
    req = "Refund Policy"
    content = "Our refund policy states that you can return items within 30 days."
    result = auditor.audit_asset(req, content)
    print(f"Test 1 (Keyword): {result['passed']} (Score: {result['score']:.2f})")
    
    # Test 2: Semantic Match
    req = "Pricing Strategy"
    content = "The cost of the item is determined by market value."
    result = auditor.audit_asset(req, content)
    print(f"Test 2 (Semantic): {result['passed']} (Score: {result['score']:.2f})")

async def test_simulation():
    print("\n--- Testing Layer 3: Simulation Service ---")
    sim_service = SimulationService()
    agent = MockAgent()
    
    # Mocking the Grade function to avoid LLM call in test
    async def mock_grade(scenario, reply, role):
        return {"score": 1, "reason": "Mock Pass"}
    
    sim_service._grade_interaction = mock_grade
    
    report = await sim_service.run_fire_drill(agent)
    print(f"Fire Drill Report: Passed={report['passed']}, Score={report['total_score']}/{report['max_score']}")

async def test_layer5_guard():
    print("\n--- Testing Layer 5: Runtime Guard ---")
    auditor = KnowledgeAuditor()
    
    query = "What is the price of iPhone 15?"
    chunk = "The iPhone 13 cover costs $10."
    score = auditor.cross_check(query, chunk)
    print(f"Query: {query}")
    print(f"Chunk: {chunk}")
    print(f"Relevance Score: {score:.4f} (Should be low)")
    
    chunk2 = "The iPhone 15 is priced at $999."
    score2 = auditor.cross_check(query, chunk2)
    print(f"Chunk: {chunk2}")
    print(f"Relevance Score: {score2:.4f} (Should be high)")

async def main():
    await test_knowledge_auditor()
    await test_simulation()
    await test_layer5_guard()

if __name__ == "__main__":
    asyncio.run(main())
