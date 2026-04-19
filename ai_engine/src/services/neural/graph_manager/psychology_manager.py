"""
 PSYCHOLOGY MANAGER  The Arbiter of Personality Shifts
Cluaiz Neural OS | graph_manager/psychology_manager.py

Role: Detects shifts in User/Boss psychology and manages stateful graph updates.
"""
from typing import Dict, Any, Optional
from loguru import logger
import hashlib
import json

from src.database.neo4j_client import neo4j_client
from ..neurons.identity.psychology import create_psychology_neuron

class PsychologyManager:
    """
    Ensures the Neural Graph remembers 'Who' the user is emotionally.
    Uses Hashing to minimize redundant DB writes.
    """
    
    async def sync_user_psychology(self, user_id: str, org_id: str, psychology_layer: Dict[str, Any], user_role: str = "visitor"):
        """
        1. Checks for a state shift compared to last known psychology.
        2. If changed, creates a new PsychologyMap neuron.
        3. Links it to the appropriate Identity (Boss or Visitor).
        """
        if not psychology_layer:
            return None

        # 1. Change Detection (Hash-based)
        # We only care about the core P1-P8 content for the hash
        psych_str = json.dumps(psychology_layer, sort_keys=True)
        new_hash = hashlib.md5(psych_str.encode()).hexdigest()
        
        # In production, we'd check a local cache (Redis/Memory) here.
        # For now, we simulate the 'If Changed' check.
        # NOTE: To implement full history, we always link the current Interaction to the latest psych state.
        
        logger.info(f" [PsychologyManager] Syncing state for {user_role}: {user_id}")
        
        # Normalize GIDs for Neo4j (Biological Neurons like PsychologyMap use lowercase)
        user_id = user_id.strip().lower()
        psych_gid = f"psych_{user_id}_{new_hash[:8]}".lower()

        # Step 2: Create/Update Node
        neuron = create_psychology_neuron(psych_gid, org_id)
        await neuron.sync_state(psychology_layer)

        # Step 3: Link to Identity Node (Person or Visitor)
        identity_label = "Person" if user_role in ["owner", "admin"] else "Visitor"
        
        try:
            # We use gid consistently for all biological links
            await neo4j_client.run_write(
                f"MATCH (u:{identity_label} {{gid: $user_id}}), (p:PsychologyMap {{gid: $psych_id}}) "
                "MERGE (u)-[r:CURRENT_PSYCHOLOGY]->(p)",
                user_id=user_id, psych_id=psych_gid
            )
            logger.success(f" [PsychologyManager] Linked {identity_label}:{user_id} -> PsychologyMap:{psych_gid}")
        except Exception as e:
            logger.error(f" [PsychologyManager] Failed to link identities: {e}")
            
        return psych_gid

psychology_manager = PsychologyManager()
