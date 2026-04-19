import asyncio
import os
from pprint import pprint
from src.services.aiemployees.memory.conversation_memory import ConversationMemoryManager

async def test_dual_tier_memory():
    print("=== Testing Dual-Tier Conversation Memory ===")
    
    # Needs a mock collection for the test to run without warning if Qdrant isn't prepopulated
    
    mem = ConversationMemoryManager(session_id="test_sess_1", user_id="user_123")
    
    # Add a huge block of text to test Token Drops
    huge_message = "This is a very long text " * 50 # 300 words, ~390 tokens
    
    print("\n[Test 1] Token Limit Enforcement")
    # Add 5 of these = ~1950 tokens. Our limit is 1500 tokens.
    # It should drop old messages to stay under 1500.
    for i in range(5):
        mem.add_turn("user", huge_message)
        
    print(f"Turns retained: {len(mem.short_term.history)} (Should be < 5)")
    total_retained_tokens = sum(mem.short_term._estimate_tokens(t["message"]) for t in mem.short_term.history)
    print(f"Total tokens retained: {total_retained_tokens} (Should be <= 1500)")
    
    print("\n[Test 2] Intent Action logic")
    # Fetch long term with "GREETING" vs "QUERY"
    payload_greeting = await mem.build_context_payload("Aur bhaiya kya haal hai?", "statement")
    print("Payload for statement/greeting:")
    print(f"  Long-Term History included: {'Yes' if payload_greeting['long_term_history'] else 'No'}")
    
    payload_query = await mem.build_context_payload("Pichla order kab diya tha?", "query")
    print("Payload for query:")
    print(f"  Long-Term History included: {'Yes' if payload_query['long_term_history'] else 'No (if DB Empty)'}")


if __name__ == "__main__":
    asyncio.run(test_dual_tier_memory())
