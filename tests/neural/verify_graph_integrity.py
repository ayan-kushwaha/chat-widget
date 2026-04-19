"""
🕸️ GRAPH INTEGRITY VERIFIER (PHASE 10.6)
Cluaiz Neural OS | tests/neural/verify_graph_integrity.py

Goal: Prove that Org -> Identity -> PsychologyMap connections are REAL and unbroken.
"""
import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client
from src.services.neural.graph_manager.psychology_manager import psychology_manager

async def main():
    print("🔍 [Integrity Check] Starting Graph Connection Audit...")
    await neo4j_client.connect()
    
    ORG_ID = "integrity_org_101"
    BOSS_ID = "boss_integrity"
    GUEST_ID = "guest_integrity"
    
    # Mock states (biological Neurons use lowercase GIDs automatically)
    state = {"P1_profiler": {"primary_emotion": "stable"}, "P8_loyalty": {"loyalty_score": 1.0}}

    try:
        print("\n--- [STEP 1] Setup Base Nodes & Connections ---")
        # 1. Create Org
        await neo4j_client.run_write("MERGE (o:Org {org_id: $oid, name: 'Integrity Corp'})", oid=ORG_ID)
        
        # 2. Create Boss & Link to Org
        await neo4j_client.run_write(
            "MATCH (o:Org {org_id: $oid}) "
            "MERGE (p:Person {gid: $bid, org_id: $oid}) "
            "MERGE (p)-[:MEMBER_OF]->(o)", 
            oid=ORG_ID, bid=BOSS_ID
        )
        
        # 3. Create Guest & Link to Org
        await neo4j_client.run_write(
            "MATCH (o:Org {org_id: $oid}) "
            "MERGE (v:Visitor {gid: $gid, org_id: $oid}) "
            "MERGE (v)-[:VISITED]->(o)", 
            oid=ORG_ID, gid=GUEST_ID
        )
        
        print("✅ Base Identity-to-Org links created.")

        print("\n--- [STEP 2] Sync Psychology ---")
        await psychology_manager.sync_user_psychology(BOSS_ID, ORG_ID, state, user_role="owner")
        await psychology_manager.sync_user_psychology(GUEST_ID, ORG_ID, state, user_role="visitor")
        print("✅ Psychology nodes synced and linked to identities.")

        print("\n--- [STEP 3] The Ultimate Integrity Query (The 'Chain' Test) ---")
        # Check Org
        org_res = await neo4j_client.run("MATCH (o:Org {org_id: $oid}) RETURN o", oid=ORG_ID)
        print(f"DEBUG: Org found: {len(org_res) > 0}")
        
        # Check Identities
        id_res = await neo4j_client.run("MATCH (n) WHERE n.org_id = $oid AND (n:Person OR n:Visitor) RETURN labels(n), n.gid", oid=ORG_ID)
        print(f"DEBUG: Identities found: {len(id_res)}")
        for r in id_res:
             print(f"   - {r['labels(n)']} : {r['n.gid']}")

        # Check Psychology Nodes
        p_res = await neo4j_client.run("MATCH (p:PsychologyMap) WHERE p.org_id = $oid RETURN p.gid", oid=ORG_ID)
        print(f"DEBUG: Psychology nodes found: {len(p_res)}")

        # Check Final Chain
        query = """
        MATCH (o:Org {org_id: $oid})
        MATCH (identity)-[r:MEMBER_OF|VISITED]->(o)
        MATCH (identity)-[r2:CURRENT_PSYCHOLOGY]->(p:PsychologyMap)
        RETURN labels(identity)[0] as type, identity.gid as id, p.gid as psych_id
        """
        records = await neo4j_client.run(query, oid=ORG_ID)
        
        if len(records) >= 2:
            print(f"🔥 TOTAL CONNECTIONS VERIFIED: {len(records)}")
            for rec in records:
                print(f"   📍 {rec['type']}:{rec['id']} ---[:CURRENT_PSYCHOLOGY]---> PsychologyMap:{rec['psych_id']}")
            print("\n✅ [RESULT] Graph Integrity is 100% Solid. Everything is connected to the Org!")
        else:
            print(f"❌ [RESULT] Integrity check failed. Found only {len(records)} active connections.")
            # Let's see what's missing
            path_check = await neo4j_client.run("MATCH (n)-[r]->(m) WHERE n.org_id = $oid RETURN labels(n), type(r), labels(m)", oid=ORG_ID)
            print("\n--- Current Relationships for this Org ---")
            for r in path_check:
                print(f"   ({r['labels(n)']}) -[:{r['type(r)']}]-> ({r['labels(m)']})")

    except Exception as e:
        print(f"❌ FATAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
