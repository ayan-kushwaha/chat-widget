"""

    CONFLICT NODE  Managing Contradictory Information         
  Cluaiz Neural OS | neurons/knowledge/conflict.py                
                                                                  
  Role: Specialized Neuron for detecting Data Discrepancies.      
        Linked to conflicting EvidenceNodes.                     

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class ConflictNode(BaseNeuron):
    def __init__(self, conflict_id: str, org_id: str):
        super().__init__(
            gid=conflict_id, 
            org_id=org_id, 
            label="NeuralConflict", 
            pillar="Cognition", 
            name="Data Conflict Detected",
            description="A neural node representing a discrepancy between data sources."
        )

    async def sync_dna(self, discordance_type: str, evidence_a_gid: str, evidence_b_gid: str):
        """
        Syncs specialized Conflict DNA: Discrepancy details and sources.
        """
        dna = {
            "conflict_nature": discordance_type,
            "evidence_node_a_gid": evidence_a_gid,
            "evidence_node_b_gid": evidence_b_gid,
            "resolution_status": "Pending",
            "neuron_type": "KNOWLEDGE_CONFLICT"
        }
        
        logger.warning(f" [ConflictNode] Conflict detected: {discordance_type} (Source A: {evidence_a_gid})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_conflict_node(conflict_id: str, org_id: str):
    return ConflictNode(conflict_id, org_id)
