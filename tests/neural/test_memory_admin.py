"""
🛠️ MEMORY ADMIN TEST — Admin Layer Verification
Cluaiz Neural OS | tests/neural/test_memory_admin.py

Goal: Verify that the ClickHouse Admin suite correctly reports stats and searches archives.
"""
import asyncio
import os
import sys
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.services.neural.metabolism.manager.ch_admin import ch_admin
from src.database.clickhouse_client import ch_client

async def main():
    print("📊 [Memory Admin Test] Verifying Analytical Control Layer...")
    ch_client.connect()
    
    # 1. Fetch Stats
    print("\n--- [STEP 1] Fetching Storage Statistics ---")
    stats = ch_admin.get_storage_stats()
    print(f"✅ ClickHouse Status: {stats['status']}")
    print(f"📦 Total Archived: {stats.get('total_archived_memories', 0)}")
    
    # 2. Search Archives
    print("\n--- [STEP 2] Searching Vault for 'Vyapnix' ---")
    results = ch_admin.search_archives("Vyapnix")
    if results:
        print(f"🔥 SUCCESS: Found {len(results)} matches for 'Vyapnix'. First match: {results[0]['title']}")
    else:
        print("💡 No matches found (Expected if test was clean, or check STEP 1 archival result).")

    # 3. Analytics Distribution
    if stats.get("top_orgs"):
        print(f"📈 Top Organization: {stats['top_orgs'][0]['org_id']} ({stats['top_orgs'][0]['count']} memories)")

    print("\n🏁 [Memory Admin Test] Verification Complete.")

if __name__ == "__main__":
    asyncio.run(main())
