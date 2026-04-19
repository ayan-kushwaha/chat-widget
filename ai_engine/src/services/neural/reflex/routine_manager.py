"""

    ROUTINE MANAGER (Phase 6)                                   
  Cluaiz Neural OS | services/neural/reflex/routine_manager.py    
                                                                  
  Role: The Autopilot Daemon. Scans the Neo4j Graph for active    
        `RoutineNeuron` connections linked to Agents, and         
        triggers promptless background task execution.            

"""

import asyncio
from loguru import logger
from typing import Dict, Any, List

try:
    from src.services.neural.graph.neo4j_client import neo4j_client
    from src.services.neural.subconscious.router_gguf import subconscious_router
    from src.services.neural.neurons.factory import factory
except ImportError:
    neo4j_client = None
    subconscious_router = None
    factory = None

class RoutineManager:
    """
    Breathes 'Life' into the Workspace by making agents work autonomously 
    without waiting for human interaction.
    """
    def __init__(self):
        self.is_running = False

    async def scan_and_execute_routines(self, org_id: str) -> Dict[str, Any]:
        """
        Daemon hook intended to run periodically via a Background Task or Cron.
        Finds pending RoutineNeurons and triggers the executing Agent.
        """
        if not neo4j_client:
            logger.error(" [RoutineManager] Graph DB offline. Autopilot disabled.")
            return {"status": "failed", "executed": 0}

        logger.info(f" [RoutineManager] Scanning Graph for Due Routines (Org: {org_id})...")
        
        #  Step 1: Query Neural Graph for active routines 
        # Identifies any Agent that HAS_ROUTINE where status is active/due.
        query = """
        MATCH (a:AgentNeuron {org_id: $org_id})-[:HAS_ROUTINE]->(r:RoutineNeuron)
        WHERE r.status = 'active'
        RETURN a.agent_id AS agent_id, a.name AS agent_name, 
               r.routine_id AS routine_id, r.description AS task, r.schedule AS schedule
        """
        res = neo4j_client.execute_query(query, {"org_id": org_id})
        
        if not res:
            logger.debug(f" [RoutineManager] All workspace routines fulfilled. Agents idle.")
            return {"status": "success", "executed": 0}

        executed_count = 0
        
        #  Step 2: Promptless Subconscious Dispatch 
        for routine in res:
            agent_id = routine['agent_id']
            task_desc = routine['task']
            routine_id = routine['routine_id']
            agent_name = routine['agent_name']
            
            logger.info(f" [Autopilot] Waking up '{agent_name}' for autonomous task: '{task_desc}'")
            
            # 1. We format a 'System' instinct text 
            instinct_prompt = f"SYSTEM_AUTOPILOT_TRIGGER: Execute your scheduled routine -> {task_desc}"
            
            # 2. We mock an active Graph Node so the Subconscious Router treats it as Top Priority (MCES: 1.0)
            priority_node = [{
                "id": routine_id, 
                "name": f"Routine_{routine_id}", 
                "type": "RoutineNeuron", 
                "mces_score": 1.0  # Absolute priority override
            }]
            
            try:
                # 3. Non-blocking dispatch to the Level 4 Router (GGUF/BitNet)
                asyncio.create_task(asyncio.to_thread(
                    subconscious_router.determine_action_path,
                    instinct_prompt,
                    priority_node
                ))
                
                # 4. Optional: Mark Routine as 'processing' or 'completed' in DB based on interval
                # ...
                
                executed_count += 1
                
            except Exception as e:
                logger.error(f" [RoutineManager] Failed to dispatch workflow to {agent_name}: {e}")
            
        logger.success(f" [RoutineManager] Successfully launched {executed_count} autonomous workflows for Org {org_id}.")
        return {"status": "success", "executed": executed_count}

# Singleton Autopilot
routine_manager = RoutineManager()
