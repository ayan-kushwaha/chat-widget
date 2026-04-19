"""
 PURGE CRON  The Daily Neural Custodian
Cluaiz Neural OS | services/neural/metabolism/purge_cron.py

Runs once a day to clean up expired neurons across all DBs.
"""
import asyncio
import os
import sys
import time
from loguru import logger

# Add workspace root
sys.path.append(os.getcwd())

from src.database.neo4j_client import neo4j_client
from src.services.neural.metabolism.metabolism_manager import metabolism_manager

async def run_daily_purge():
    print(" [PurgeCron] Initializing Daily Neural Metabolism...")
    await neo4j_client.connect()
    
    now = int(time.time() * 1000)
    
    # 1. Find Expired Neurons
    query = """
    MATCH (n) 
    WHERE n.expiry_ts < $now AND n.ttl_days < 9999
    RETURN n.gid as gid, n.org_id as oid, labels(n)[0] as label, n.source_id as sid
    """
    expired_neurons = await neo4j_client.run(query, now=now)
    
    if not expired_neurons:
        print(" No expired neurons found today. Metabolism is stable.")
    else:
        print(f" Found {len(expired_neurons)} expired neurons. Purging...")
        for r in expired_neurons:
            await metabolism_manager.purge_neuron(
                gid=r['gid'], 
                org_id=r['oid'], 
                label=r['label'], 
                source_id=r.get('sid')
            )
            
    # 2. Cleanup Orphaned Topics (Optional - logic can be extended here)
    # If a topic has no member episodes, delete it.
    orphan_query = """
    MATCH (t:Topic)
    WHERE NOT (t)<-[:IN_TOPIC]-(:Episode)
    RETURN t.gid as gid, t.org_id as oid
    """
    orphans = await neo4j_client.run(orphan_query)
    for r in orphans:
        await metabolism_manager.purge_neuron(gid=r['gid'], org_id=r['oid'], label="Topic")

    await neo4j_client.close()
    print(" [PurgeCron] Metabolism Cleanup Complete.")

if __name__ == "__main__":
    asyncio.run(run_daily_purge())
