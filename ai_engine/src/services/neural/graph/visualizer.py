"""

    GRAPH VISUALIZER (Phase 7)                                  
  Cluaiz Neural OS | services/neural/graph/visualizer.py          
                                                                  
  Role: Fetches real-time topologies from Neo4j, formats them     
        for D3/Force-Graph UI, and ensures strict scalability     
        so browsers don't crash from 10k+ nodes.                  

"""

from loguru import logger
from typing import Dict, Any, List

from src.database.neo4j_client import neo4j_client

class GraphVisualizerService:
    """
    Core engine for rendering the "Brain" of Cluaiz.
    Transforms raw Neo4j records into a Node/Link JSON schema for React.
    """

    async def get_visual_map(self, org_id: str, limit: int = 150) -> Dict[str, Any]:
        """
        Retrieves a scoped neural topography for the given organization.
        Filters for highest-priority nodes to keep map readability.
        """
        if not neo4j_client or not neo4j_client.enabled:
            return {"nodes": [], "links": []}

        #  Step 1: Query Neo4j for most relevant sub-graph 
        # We find up to limit nodes and their relationships.
        # We prioritize core hierarchy nodes (Identity, Agent, Skill) and active episodes.
        # RELAXED FILTER: Added Document, Hub, Tool, Routine, etc. and lowered score threshold.
        query = f"""
        MATCH (n {{org_id: $org_id}})
        WHERE n.priority_score > 0.05 OR 
              n:IdentityNeuron OR n:AgentNeuron OR n:SkillNeuron OR n:Org OR n:Boss OR 
              n:Document OR n:Hub OR n:Tool OR n:Routine OR n:Department OR
              n.golden_vault = true
        WITH n ORDER BY n.priority_score DESC LIMIT $limit
        
        // Find links where BOTH source and target are in our top sample
        OPTIONAL MATCH (n)-[r]->(m)
        WHERE m.org_id = $org_id AND 
              (m.priority_score > 0.05 OR 
               m:IdentityNeuron OR m:AgentNeuron OR m:SkillNeuron OR m:Org OR m:Boss OR 
               m:Document OR m:Hub OR m:Tool OR m:Routine OR m:Department OR
               m.golden_vault = true)
               
        RETURN 
            n, labels(n) as n_labels, elementId(n) as n_eid,
            r, type(r) as r_type, elementId(r) as r_eid,
            m, labels(m) as m_labels, elementId(m) as m_eid
        """
        
        try:
            # Using the unified async client
            res = await neo4j_client.run(query, org_id=org_id, limit=limit)
        except Exception as e:
            logger.error(f" [Visualizer] Query failed: {e}")
            return {"nodes": [], "links": []}
        
        if not res:
            return {"nodes": [], "links": []}

        #  Step 2: Format Data for Frontend Topologies 
        nodes_dict = {}
        links_list = []
        links_seen = set()
        
        def process_neuron(node_props, labels, eid):
            if not node_props: return None
            
            # Establish Semantic ID mapping so it bridges seamlessly with Mongo's logical lattice
            label = labels[0] if labels else "Unknown"
            
            # Use logical ID if available, else elementId
            node_id = (
                node_props.get("org_id") if label in ["Org", "Organization"] else
                node_props.get("node_id") or node_props.get("agent_id") or node_props.get("skill_id") or 
                node_props.get("dept_id") or node_props.get("user_id") or node_props.get("goal_id") or 
                node_props.get("doc_id") or node_props.get("emp_id") or eid
            )

            if label in ["Org", "Organization"] and node_id:
                node_id = f"org_{node_id}" # Maps exactly to Mongo dimension's fake pivot id

            if node_id in nodes_dict: return node_id
            
            primary_label = label.replace("Neuron", "")
            
            # Determine priority score
            p_score = node_props.get("priority_score", 0.5)
            is_vault = node_props.get("golden_vault", False)
                
            nodes_dict[node_id] = {
                "id": node_id,
                "label": node_props.get("name", primary_label),
                "type": primary_label,
                "score": p_score,
                "isVault": is_vault,
                "properties": node_props
            }
            return node_id
            
        for record in res:
            # Defensive check for record type (some drivers return Record objects which are tuple-like)
            if isinstance(record, (list, tuple)):
                try:
                    r_dict = {
                        "n": record[0], "n_labels": record[1], "n_eid": record[2],
                        "r": record[3], "r_type": record[4], "r_eid": record[5],
                        "m": record[6], "m_labels": record[7], "m_eid": record[8]
                    }
                    record = r_dict
                except: continue
                
            if not isinstance(record, dict): continue

            # Source Node
            s_id = process_neuron(record.get("n"), record.get("n_labels"), record.get("n_eid"))
            
            # Target Node (Optional)
            t_id = process_neuron(record.get("m"), record.get("m_labels"), record.get("m_eid"))
            
            # Edge (Optional)
            r_props = record.get("r")
            r_type = record.get("r_type")
            r_eid = record.get("r_eid")
            
            if r_eid and r_eid not in links_seen and s_id and t_id:
                links_seen.add(r_eid)
                l_label = r_type or "CONNECTED_TO"
                
                # Defensive weight calculation
                l_weight = 2
                if isinstance(r_props, dict):
                    l_weight = max(1, int(r_props.get("strength", 1.0) * 2))
                
                links_list.append({
                    "source": s_id,
                    "target": t_id,
                    "label": l_label,
                    "weight": l_weight
                })

        logger.info(f" [Visualizer] Successfully extracted {len(nodes_dict)} neurons and {len(links_list)} synapses for UI mapping.")

        return {
            "nodes": list(nodes_dict.values()),
            "links": links_list
        }

visualizer_service = GraphVisualizerService()
