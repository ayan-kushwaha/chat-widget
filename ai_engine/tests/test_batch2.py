import asyncio
from src.services.aiskills.contracts.executive.orchestrator import TheOrchestratorContract, OrchestratorInput
from src.services.aiskills.contracts.types import ContextPackage

async def test_orchestrator():
    print("\n--- Testing Shadow Boss Orchestrator [E2] ---")
    
    skill = TheOrchestratorContract()
    
    # Complex query requiring Anjali (Scheduler) and Sarah (Support)
    query = "Mujhe kal ek meeting schedule karni hai apne team ke sath, aur yeh bhi check karo ki mera last iPhone 15 ka order abhi tak deliver kyun nahi hua, main bahut gussa hoon."
    
    params = OrchestratorInput(text=query)
    context = ContextPackage(employee_id="shadow_boss", business_id="test")
    
    print(f"QUERY: {query}\n")
    
    result = await skill._run(params=params, entities={}, context_package=context)
    
    print("--- Orchestrator Result ---")
    print(f"Status: {result.get('status')}")
    print(f"Reply: \n{result.get('reply')}")
    
    if "delegation_plan" in result:
        print("\nParsed Delegation Plan:")
        import json
        print(json.dumps(result["delegation_plan"], indent=2))

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
