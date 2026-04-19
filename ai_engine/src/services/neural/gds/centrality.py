"""

    GDS CENTRALITY  Automatic Hebb-Rank Prioritization         
  Cluaiz Neural OS | services/neural/gds/centrality.py            
                                                                  
  Role: Runs PageRank over the In-Memory Projected Graph to       
        autonomously identify mission-critical business rules     
        and boost their priority scores without LLM prompting.    

"""

from loguru import logger
from .engine import gds_engine, HAS_GDS_CLIENT

class PriorityCentrality:
    """
    The mathematical subconscious filter for finding "What Matters Most".
    """
    def __init__(self, org_id: str):
        self.org_id = org_id
        self.projection_name = f"SubconsciousGraph_{org_id}"
        self.gds = gds_engine.gds

    def run_hebbrank_pagerank(self) -> bool:
        """
        Calculates the topological 'Authority' of every neuron.
        The results are permanently written back to the Neo4j database 
        as the 'priority_score' property on the nodes.
        """
        if not HAS_GDS_CLIENT or not self.gds:
            logger.error(" [GDS Centrality] GDS Client offline. Cannot calculate Hebb-Rank.")
            return False
            
        logger.info(f" [GDS Centrality] Executing Hebb-Rank (PageRank) auto-prioritization for Org: {self.org_id}...")
        
        try:
            # Fetch the <100ms RAM Graph
            G = self.gds.graph.get(self.projection_name)
            
            # Weighted PageRank taking 'relationshipWeight' into account
            result = self.gds.pageRank.mutate(
                G,
                mutateProperty='priority_score',
                dampingFactor=0.85,
                maxIterations=20,
                relationshipWeightProperty='weight'
            )
            
            # Flash the calculated scores back to the permanent disk nodes
            self.gds.graph.writeNodeProperties(G, ["priority_score"])
            
            logger.info(" [GDS Centrality] Hebb-Rank complete. Central business neurons mathematically verified and boosted.")
            return True
            
        except Exception as e:
            logger.error(f" [GDS Centrality] Hebb-Rank mathematical failure: {e}")
            return False
