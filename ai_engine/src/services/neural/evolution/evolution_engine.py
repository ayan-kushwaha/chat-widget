"""

   EVOLUTION ENGINE  The High-Weight Neural Harvester            
  Cluaiz Neural OS | evolution/evolution_engine.py                  
                                                                    
  Role: Scans the Unified Graph for high-impact interactions       
        and prepares them for autonomous fine-tuning.               

"""
from loguru import logger
import json
import os
from datetime import datetime
from src.database.neo4j_client import neo4j_client
from src.services.neural.training.atma_trainer import subconscious_trainer

class EvolutionEngine:
    """
    Orchestrates the transition from "Graph Knowledge" to "Model Weights".
    """
    
    async def run_evolution_cycle(self, org_id: str, min_weight: float = 1.5):
        """
        1. Harvests high-weight Episode-QA pairs.
        2. Formats them into SFT (Supervised Fine-Tuning) shards.
        3. Triggers the AtmaTrainer.
        """
        logger.info(f" [Evolution] Starting evolution cycle for Org: {org_id} (min_weight={min_weight})")
        
        # 1. Harvest high-weight interactions
        # We look for Episodes that have been reinforced by reactions or successful audits
        query = """
        MATCH (e:EpisodeNeuron)-[:HAS_TOPIC]->(t:TopicNeuron)
        OPTIONAL MATCH (e)-[:IN_STATE]->(p:PsychologyMap)
        WHERE e.interaction_weight >= $min_weight AND e.org_id = $org_id
        RETURN e.message AS input, 
               e.response AS output, 
               t.name AS topic, 
               e.interaction_weight AS weight,
               p.p1_mood AS mood,
               p.p8_loyalty AS loyalty,
               p.p6_emoji_vibe AS emoji_vibe
        ORDER BY e.interaction_weight DESC
        LIMIT 100
        """
        # Fix: Using .run() because it returns records, and keywords for params
        records = await neo4j_client.run(query, min_weight=min_weight, org_id=org_id)
        
        if not records:
            logger.info(" [Evolution] No high-impact experiences found. Memory consolidation skipped.")
            return False
            
        # 2. Prepare training shard
        shard_path = self._prepare_shard(org_id, records)
        
        # 3. Trigger Training Logic (Delegated to AtmaTrainer)
        # Note: In a real prod environment, this would be a background task
        logger.success(f" [Evolution] Shard created with {len(records)} samples: {shard_path}")
        
        # For simulation, we check if AtmaTrainer is ready
        if subconscious_trainer.is_evolution_ready(org_id, len(records), last_train_hours=25, idle_hours=7):
            subconscious_trainer.execute_nightly_evolution()
            return True
            
        return False

    def _prepare_shard(self, org_id: str, records: list) -> str:
        """
        Converts Neo4j records into a JSONL training file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        shard_dir = os.path.join("data", "evolution_shards", org_id)
        os.makedirs(shard_dir, exist_ok=True)
        
        file_path = os.path.join(shard_dir, f"shard_{timestamp}.jsonl")
        
        with open(file_path, "w", encoding="utf-8") as f:
            for rec in records:
                entry = {
                    "instruction": f"Based on the topic of {rec['topic']} and the user's mood ({rec.get('mood', 'neutral')}), respond naturally.",
                    "input": rec["input"],
                    "output": rec["output"],
                    "metadata": {
                        "weight": rec["weight"],
                        "loyalty": rec.get("loyalty", 0.5),
                        "emoji_vibe": rec.get("emoji_vibe", False)
                    }
                }
                f.write(json.dumps(entry) + "\n")
                
        return file_path

evolution_engine = EvolutionEngine()
