"""

    BASE NEURON  The DNA of Cluaiz Biological Brain            
  Cluaiz Neural OS | services/neural/neurons/base_neuron.py       
                                                                  
  Role: The parent class for all 1000+ neuron types.              
        Handles Persistence, Metabolism, and Wiring.              

"""

import time
from typing import Any, Dict, Optional
from loguru import logger
from src.database.neo4j_client import neo4j_client

class BaseNeuron:
    def __init__(
        self, 
        gid: str, 
        org_id: str, 
        label: str, 
        pillar: str = "Cognition",
        name: str = "",
        description: str = ""
    ):
        self.gid = gid.strip().lower()
        self.org_id = org_id
        self.label = label
        self.pillar = pillar.capitalize()
        self.name = name
        self.description = description
        
        # Metabolism Defaults
        self.priority_score = 1.0
        self.access_count = 0
        self.last_accessed = int(time.time() * 1000)
        self.golden_vault = False
        self.decay_rate = 0.05 # 5% decay per cycle
        self.ttl_days = 30 # Default TTL
        self.expiry_ts = int((time.time() + (self.ttl_days * 86400)) * 1000)

    async def sync_to_neo4j(self, dna: Dict[str, Any] = None):
        """
        Merge this neuron into the Neo4j graph with its unique DNA.
        """
        id_key = self._get_id_key()
        
        # Base Properties
        props = {
            "name": self.name,
            "description": self.description,
            "org_id": self.org_id,
            "pillar": self.pillar,
            "priority_score": self.priority_score,
            "access_count": self.access_count,
            "last_accessed": self.last_accessed,
            "golden_vault": self.golden_vault,
            "decay_rate": self.decay_rate,
            "ttl_days": self.ttl_days,
            "expiry_ts": self.expiry_ts
        }
        
        # Attach specialized DNA (Neuron-specific patterns)
        if dna:
            props.update(dna)

        try:
            # 1. Merge Node
            await neo4j_client.merge_node(
                label=self.label, 
                match_props={id_key: self.gid, "org_id": self.org_id},
                set_props=props
            )
            
            # 2. Link to Pivot Hub
            hub_name = self._get_hub_name()
            await neo4j_client.merge_relationship(
                from_label="Hub", from_id_key="name", from_id_val=hub_name,
                to_label=self.label, to_id_key=id_key, to_id_val=self.gid,
                relation="MAPS_NEURON", props={"org_id": self.org_id}
            )
            
            logger.info(f" [BaseNeuron] Synced {self.label}:{self.gid} to {hub_name}")
            
        except Exception as e:
            logger.error(f" [BaseNeuron] Sync failed for {self.gid}: {e}")

    def _get_id_key(self) -> str:
        mapping = {
            "Agent": "agent_id", "Skill": "skill_id", "Goal": "goal_id",
            "Document": "doc_id", "Employee": "emp_id", "Focus": "focus_id",
            "Episode": "episode_id", "History": "history_id",
            "PsychologyMap": "gid", "Topic": "gid"
        }
        return mapping.get(self.label, "gid") # Default to gid for modern neurons

    def _get_hub_name(self) -> str:
        if self.pillar in ["Workforce", "Reflex"]: 
            return "AI Workforce Hub"
        if self.pillar in ["Identity", "Essence"]: 
            return "Essence & Context"
        if self.pillar in ["Cognition", "Knowledge", "Memory"]: 
            return "Knowledge Cognition"
        return "Knowledge Cognition"

    def touch(self):
        """Reinforce the neuron on access."""
        self.access_count += 1
        self.last_accessed = int(time.time() * 1000)
        self.priority_score = min(1.0, self.priority_score + 0.1)
