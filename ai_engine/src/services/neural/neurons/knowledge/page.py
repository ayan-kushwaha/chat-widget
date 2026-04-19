"""

    PAGE NEURON  Structural Hierarchies in Knowledge        
  Cluaiz Neural OS | neurons/knowledge/page.py                  
                                                                  
  Role: Specialized Neuron for document pages or sections.        
        Acts as a map for ChunkNodes and structural levels.       

"""

from src.services.neural.neurons.base_neuron import BaseNeuron
from loguru import logger

class PageNeuron(BaseNeuron):
    def __init__(self, page_id: str, org_id: str, name: str):
        super().__init__(
            gid=page_id, 
            org_id=org_id, 
            label="DocumentPage", 
            pillar="Cognition", 
            name=name,
            description=f"Structural Page/Section: {name}."
        )

    async def sync_dna(self, level: int, source_url: str, summary: str):
        """
        Syncs specialized Page DNA: Hierarchical level and source mapping.
        """
        dna = {
            "page_hierarchy_level": level,
            "source_origin_url": source_url,
            "page_context_summary": summary,
            "neuron_type": "PAGE_INDEX"
        }
        
        logger.info(f" [PageNeuron] Syncing DNA for {self.name} (Level: {level})")
        await self.sync_to_neo4j(dna=dna)

# Helper
def create_page_neuron(page_id: str, org_id: str, name: str):
    return PageNeuron(page_id, org_id, name)
