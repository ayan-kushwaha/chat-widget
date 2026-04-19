"""

    BRAIN JANITOR  Metabolic Decay & Temporal Pruning       
  Cluaiz Neural OS | services/neural/metabolism/janitor.py        
                                                                  
  Role: Periodic Cleanup of the Nervous System (Decay & TTL).     
        Enforces 7-Day Safety Rule for all Raw Data.              

"""

import time
from loguru import logger
from src.database.neo4j_client import neo4j_client

class BrainJanitor:
    
    async def run_metabolism(self, org_id: str):
        """
        Runs the daily metabolism cycle: 
        1. Exponential Decay of priority scores.
        2. Pruning of weak/orphaned nodes (lower than 0.1 priority).
        3. Enforcing the 7-Day Safety Rule.
        """
        logger.info(f" [Janitor] Starting Biological Metabolism for Org: {org_id}")
        
        now = int(time.time() * 1000)
        ms_per_day = 24 * 60 * 60 * 1000
        seven_days_ago = now - (7 * ms_per_day)

        #  Step 1: Exponential Decay Logic 
        # Formula: priority = priority * exp(-decay_rate * days_passed)
        # We perform this in Cypher to handle bulk nodes efficiently
        await neo4j_client.run(
            """
            MATCH (n {org_id: $oid})
            WHERE n.last_accessed < $now
              AND (n.golden_vault IS NULL OR n.golden_vault = false)
            WITH n, ( ($now - n.last_accessed) / $ms_day ) as days_passed
            SET n.priority_score = n.priority_score * exp( -coalesce(n.decay_rate, 0.05) * days_passed )
            """,
            oid=org_id, now=now, ms_day=float(ms_per_day)
        )

        #  Step 2: Genetic Pruning (Metabolism) 
        # Delete if priority drops below 0.1 AND is not recently accessed (7-day rule)
        res = await neo4j_client.run(
            """
            MATCH (n {org_id: $oid})
            WHERE n.priority_score < 0.1
              AND n.last_accessed < $safe_time
              AND (n.golden_vault IS NULL OR n.golden_vault = false)
            WITH n LIMIT 500
            DETACH DELETE n
            RETURN count(n) as pruned_count
            """,
            oid=org_id, safe_time=seven_days_ago
        )
        
        count = res[0].get("pruned_count", 0) if res else 0
        logger.info(f" [Janitor] Metabolism Cycle Completed. Pruned {count} weak neurons.")

janitor = BrainJanitor()
