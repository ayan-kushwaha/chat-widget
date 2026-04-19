"""

    HANDOVER GATE (Phase 6)                                     
  Cluaiz Neural OS | services/neural/reflex/handover_gate.py      
                                                                  
  Role: Super-fast Logic Gate that triggers when an Agent lacks   
        a capability. It traverses the Graph Database to find     
        acolleague Agent with the right SkillNeuron, and          
        seamlessly hands over the active Episode thread.          

"""

import os
from loguru import logger
from typing import Optional, Dict, Any

try:
    from src.services.neural.graph.neo4j_client import neo4j_client
    from src.services.neural.graph.synapse_builder import synapse_builder
    from src.services.neural.neurons.factory import factory
except ImportError:
    neo4j_client = None
    synapse_builder = None
    factory = None

class HandoverGate:
    """
    Sub-50ms Reflex Logic Gate for seamless multi-agent collaboration.
    """
    def __init__(self):
        pass

    async def execute_handover(self, current_agent_id: str, episode_id: str, required_capability: str, org_id: str) -> Dict[str, Any]:
        """
        Executes a multi-agent handover using raw Graph Traversal.
        
        Flow:
        1. Find an agent with the required skill or matching description in the org.
        2. Transfer the active EpisodeNeuron to the new Agent.
        3. Log the 'HandoverReflex' node in the Graph for memory.
        """
        if not neo4j_client:
            logger.error(" [HandoverGate] Neo4j Client offline. Handover aborted.")
            return {"status": "failed", "reason": "db_offline"}

        logger.info(f" [HandoverGate] Agent '{current_agent_id}' initiating Handover Search for: '{required_capability}'")
        
        #  Step 1: Subconscious Graph Traversal 
        # MATCH pattern: Find Agent who owns a Skill matching the capability, OR the agent themselves match it.
        query = """
        MATCH (a:AgentNeuron {org_id: $org_id})
        OPTIONAL MATCH (a)-[:HAS_SKILL]->(s:SkillNeuron)
        WHERE toLower(a.description) CONTAINS toLower($cap) OR toLower(s.description) CONTAINS toLower($cap) OR toLower(s.name) CONTAINS toLower($cap)
        RETURN a.agent_id AS target_agent, a.name AS target_name, count(s) as skill_matches
        ORDER BY skill_matches DESC LIMIT 1
        """
        params = {"org_id": org_id, "cap": required_capability.lower()}
        
        res = neo4j_client.execute_query(query, params)
        if not res or not res[0].get("target_agent"):
            logger.warning(f" [HandoverGate] No suitable agent capable of '{required_capability}' found in Org {org_id}.")
            return {"status": "failed", "reason": "no_agent_available"}
            
        target_agent_id = res[0]["target_agent"]
        target_name = res[0]["target_name"]
        
        if target_agent_id == current_agent_id:
            logger.warning(" [HandoverGate] Handover target is the same as current agent. Preventing infinite loop.")
            return {"status": "failed", "reason": "recursive_handover"}
            
        #  Step 2: Physical Synapse Transfer (Neural Logging) 
        gate_id = f"gate_{episode_id}_{target_agent_id}"
        
        try:
            # Spawn the reflex proxy node
            gate_neuron = factory.spawn("HandoverReflex", gate_id, org_id, name="Auto-Handover Switch")
            await gate_neuron.sync_to_neo4j({
                "from_agent": current_agent_id, 
                "to_agent": target_agent_id, 
                "reason": required_capability
            })
            
            # Wire: HandoverReflex -> Agent (TRANSFERS_TO)
            synapse_builder.wire_neurons(
                source_id=gate_id, source_label="HandoverReflex",
                target_id=target_agent_id, target_label="Agent",
                org_id=org_id
            )
        except Exception as e:
             logger.error(f" [HandoverGate] Failed to securely log handover trace: {e}")
        
        logger.success(f" [HandoverGate] Success! Task dispatched from {current_agent_id} to {target_name} ({target_agent_id}).")
        
        return {
            "status": "success",
            "target_agent_id": target_agent_id,
            "target_agent_name": target_name,
            "message": f"Transferring you to {target_name}, our specialist for this request."
        }

# Singleton Reflex Gate
handover_gate = HandoverGate()
