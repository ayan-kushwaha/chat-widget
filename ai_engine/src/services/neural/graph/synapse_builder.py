"""

    SYNAPSE BUILDER  Physical Graph Wiring                     
  Cluaiz Neural OS | services/neural/graph/synapse_builder.py     
                                                                  
  Role: Reads `NEURAL_PATHWAYS.yaml` and physically executes      
        the `CREATE` or `MERGE` Cypher queries to link neurons.   

"""

import os
import yaml
from loguru import logger
from typing import Optional

try:
    from .neo4j_client import neo4j_client
except ImportError:
    neo4j_client = None

class SynapseBuilder:
    """
    Translates architectural DNA (YAML) into physical graph connections (Neo4j Edges).
    """
    def __init__(self):
        self.yaml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../NEURAL_PATHWAYS.yaml"))
        self.rules = {}
        self._load_rules()

    def _load_rules(self):
        """Loads NEURAL_PATHWAYS.yaml into memory for fast O(1) routing checks."""
        if not os.path.exists(self.yaml_path):
            logger.error(f" [SynapseBuilder] YAML rules file missing at {self.yaml_path}")
            return
            
        try:
            with open(self.yaml_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                
            if not data:
                return
                
            # Flatten rules into a lookup dictionary: {(from, to): relation}
            for section, paths in data.items():
                if not isinstance(paths, list): continue
                for path in paths:
                    src = path.get("from")
                    tgt = path.get("to")
                    rel = path.get("relation")
                    if src and tgt and rel:
                        self.rules[(src, tgt)] = rel
            logger.info(f" [SynapseBuilder] Loaded {len(self.rules)} structural mapping rules from Neural DNA (YAML).")
        except Exception as e:
            logger.error(f" [SynapseBuilder] Failed to parse YAML: {e}")

    def get_valid_relation(self, source_label: str, target_label: str) -> Optional[str]:
        """
        Calculates the correct Edge Label based on the node types.
        E.g., Agent + Skill = HAS_SKILL
        """
        # Clean labels to match YAML definitions (e.g., CodeChunkNeuron -> CodeChunk)
        src = source_label.replace("Neuron", "")
        tgt = target_label.replace("Neuron", "")
        
        # 1. Exact Match Check
        if (src, tgt) in self.rules:
            return self.rules[(src, tgt)]
            
        # 2. Wildcard Check (e.g., GoldenVault -> AnyNode)
        for (r_src, r_tgt), rel in self.rules.items():
            if r_src == src and r_tgt == "AnyNode":
                return rel
            if r_src == "AnyNode" and r_tgt == tgt:
                return rel

        return None

    def wire_neurons(self, source_id: str, source_label: str, target_id: str, target_label: str, org_id: str) -> bool:
        """
        Physically creates the structural edge in Neo4j based on YAML schema constraints.
        This is the method called by Live APIs (Chat, Onboarding, etc.)
        """
        if not neo4j_client:
            logger.warning(" [SynapseBuilder] Neo4j Client missing. Synapse creation failed.")
            return False

        rel_type = self.get_valid_relation(source_label, target_label)
        if not rel_type:
            logger.warning(f" [SynapseBuilder] Illegal mapping: [{source_label}] to [{target_label}] not defined in YAML. Using fallback 'CONNECTED_TO'.")
            rel_type = "CONNECTED_TO"

        logger.info(f" [SynapseBuilder] Sparking Physical Synapse: [{source_label}] -[:{rel_type}]-> [{target_label}]...")
        
        # Cypher Execution. Strict Label Matching prevents accidental Agent->Agent cross-wiring.
        query = f"""
        MATCH (s:{source_label}) WHERE (s.node_id = $src_id OR s.agent_id = $src_id OR s.skill_id = $src_id OR s.doc_id = $src_id OR s.emp_id = $src_id OR s.goal_id = $src_id OR s.dept_id = $src_id OR s.user_id = $src_id OR s.org_id = $src_id OR s.id = $src_id) AND s.org_id = $org_id
        MATCH (t:{target_label}) WHERE (t.node_id = $tgt_id OR t.agent_id = $tgt_id OR t.skill_id = $tgt_id OR t.doc_id = $tgt_id OR t.emp_id = $tgt_id OR t.goal_id = $tgt_id OR t.dept_id = $tgt_id OR t.user_id = $tgt_id OR t.org_id = $tgt_id OR t.id = $tgt_id) AND t.org_id = $org_id
        MERGE (s)-[r:{rel_type}]->(t)
        ON CREATE SET r.org_id = $org_id, r.created_at = timestamp()
        RETURN type(r) AS relation_created
        """
        
        params = {
            "src_id": source_id,
            "tgt_id": target_id,
            "org_id": org_id
        }
        
        res = neo4j_client.execute_query(query, params)
        if res:
            logger.info(f" [SynapseBuilder] Physical Link <{rel_type}> permanently fused in Neo4j.")
            return True
        else:
            logger.error(" [SynapseBuilder] Node match failed in Neo4j. Cannot build synapse.")
            return False

# Singleton Wire Builder
synapse_builder = SynapseBuilder()

# For local testing
if __name__ == "__main__":
    builder = SynapseBuilder()
    print(f"Rule Test (Agent -> Skill): {builder.get_valid_relation('AgentNeuron', 'SkillNeuron')}")
    print(f"Rule Test (Episode -> Mood): {builder.get_valid_relation('EpisodeNeuron', 'MoodNeuron')}")
