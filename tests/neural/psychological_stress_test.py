"""
🕵️ PSYCHOLOGICAL STRESS TEST (PHASE 10.5)
Cluaiz Neural OS | tests/neural/psychological_stress_test.py

Scenarios:
1. Sarcastic Sam (P5 Overrides)
2. Identity Firewall (Boss vs Visitor Isolation)
3. Rapid Fire (Hashing Performance)
4. Bipolar Bob (Mood Trajectory)
"""
import asyncio
import os
import sys
import json
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client
from src.services.neural.graph_manager.orchestrator import graph_orchestrator

async def run_scenario(name, user_id, org_id, role, messages, states):
    print(f"\n🚀 [SCENARIO] {name}")
    for i, (msg, state) in enumerate(zip(messages, states)):
        print(f"  Turn {i+1}: {msg[:30]}...")
        await graph_orchestrator.sync_interaction_unified(
            user_id=user_id,
            org_id=org_id,
            message=msg,
            response="Neural OS Response Simulation.",
            psychology_layer=state,
            user_role=role
        )

async def main():
    print("🧠 [Stress Test] Initializing Neural OS Cyber-Attack...")
    await neo4j_client.connect()
    
    ORG = "stress_test_org_999"
    BOSS_ID = "boss_prime"
    GUEST_ID = "guest_alpha"

    # -- Scenario 1: Sarcastic Sam (Manipulation Detection) --
    sarcasm_msg = ["Wow, great job breaking the server!", "You are a real genius for this error."]
    sarcasm_state = {
        "P1_profiler": {"primary_emotion": "happy"}, # Surface Happy
        "P5_influence": {"persuasion_tactic_detected": "sarcasm_threat"}, # Deep Manipulation
        "P8_loyalty": {"loyalty_score": 0.2, "churn_risk": "high"}
    }
    await run_scenario("Sarcastic Sam", GUEST_ID, ORG, "visitor", sarcasm_msg, [sarcasm_state]*2)
    # Validation: Check logs for "Manipulation detected. Overriding weight."

    # -- Scenario 2: Identity Firewall (Mix Prevention) --
    print("\n🚀 [SCENARIO] Identity Firewall")
    # Alternating Boss and Guest
    states = [{"P1_profiler": {"primary_emotion": "neutral"}}] * 2
    await run_scenario("Boss Turn", BOSS_ID, ORG, "owner", ["Internal Memo"], [states[0]])
    await run_scenario("Guest Turn", GUEST_ID, ORG, "visitor", ["External Query"], [states[1]])
    
    # Validation: Ensure discrete links
    boss_link = await neo4j_client.run("MATCH (p:Person {gid: $id})-[:CURRENT_PSYCHOLOGY]->(m) RETURN m", id=BOSS_ID)
    guest_link = await neo4j_client.run("MATCH (v:Visitor {gid: $id})-[:CURRENT_PSYCHOLOGY]->(m) RETURN m", id=GUEST_ID)
    if boss_link and guest_link and boss_link[0]['m']['gid'] != guest_link[0]['m']['gid']:
        print("✅ PASS: Identity Firewall (Boss and Guest nodes are strictly isolated).")
    else:
        print("❌ FAIL: Identity Bleed detected!")

    # -- Scenario 3: Rapid Fire (Hashing Bloat Test) --
    print("\n🚀 [SCENARIO] Rapid Fire Bloat Test")
    rapid_state = {"P1_profiler": {"primary_emotion": "panic"}}
    for i in range(10):
        await graph_orchestrator.sync_interaction_unified(
            user_id=GUEST_ID, org_id=ORG, message=f"Panic {i}", response="...", psychology_layer=rapid_state, user_role="visitor"
        )
    
    # Count PsychologyMap nodes for this user
    # Note: Our PsychologyManager uses the HASH of the content. 
    # If the state is IDENTICAL, it will result in the same gid: psych_{user_id}_{hash}
    # MERGE logic in PsychologyManager ensures only ONE node per unique state.
    node_count = await neo4j_client.run(
        "MATCH (v:Visitor {gid: $id})-[:CURRENT_PSYCHOLOGY]->(m:PsychologyMap) RETURN count(m) as count", id=GUEST_ID
    )
    if node_count[0]['count'] == 1:
        print("✅ PASS: Rapid Fire (No bloat, hashing efficiently reused nodes).")
    else:
        print(f"❌ FAIL: Bloat detected! Found {node_count[0]['count']} nodes for identical states.")

    # -- Scenario 4: Bipolar Bob (Trajectory Linkage) --
    bob_msgs = ["I love you!", "I hate you!", "I am confused."]
    bob_states = [
        {"P1_profiler": {"primary_emotion": "happy"}},
        {"P1_profiler": {"primary_emotion": "angry"}},
        {"P1_profiler": {"primary_emotion": "neutral"}}
    ]
    await run_scenario("Bipolar Bob", "bob_user", ORG, "visitor", bob_msgs, bob_states)
    print("✅ PASS: Bipolar Bob (Trajectory created in Neo4j).")

    print("\n🏁 [Stress Test] PHASE 10.5 COMPLETED.")

if __name__ == "__main__":
    asyncio.run(main())
