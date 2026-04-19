import asyncio
from src.services.routing.shadow_boss import shadow_boss

async def test_time_anchor():
    print("\n--- Testing Global Time Anchor ---")
    
    # 1. Test with New York Timezone
    query = "Mujhe batao aaj kya date hai, aur kal kya date hogi?"
    context_ny = {
        "business_id": "test_ny", 
        "session_id": "1", 
        "user_timezone": "America/New_York"
    }
    
    # Run through the pipeline to assemble package
    res_ny = await shadow_boss.process_user_query(query, "shadow_boss", context_ny)
    pkg_ny = res_ny["context_package"]
    
    print(f"\n🌍 Context Time in NY: {pkg_ny.temporal_anchor}")
    
    # Generate shadow boss response
    response_ny = await shadow_boss.get_response_with_reasoning(
        user_message=query,
        system_instruction="You are a helpful assistant. Reply in Hinglish.",
        context_package=pkg_ny
    )
    print(f"🤖 Shadow Boss (NY Timezone): {response_ny}")
    
    # 2. Test with default (UTC / Business fallback)
    context_default = {
        "business_id": "test_default", 
        "session_id": "2",
        "user_timezone": "UTC"
    }
    res_def = await shadow_boss.process_user_query(query, "shadow_boss", context_default)
    pkg_def = res_def["context_package"]
    
    print(f"\n🌍 Context Time in UTC: {pkg_def.temporal_anchor}")
    
    response_def = await shadow_boss.get_response_with_reasoning(
        user_message=query,
        system_instruction="You are a helpful assistant. Reply in Hinglish.",
        context_package=pkg_def
    )
    print(f"🤖 Shadow Boss (UTC Timezone): {response_def}")

if __name__ == "__main__":
    asyncio.run(test_time_anchor())
