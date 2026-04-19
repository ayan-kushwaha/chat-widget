"""

   TOPIC LINKER  The Neural Concept Mapper                    
  Cluaiz Neural OS | services/neural/gds/topic_linker.py         
                                                                  
  Role: Background link generator. Builds [:LEADS_TO] edges      
        between TopicNeurons to create predictive paths without  
        relying on brute-force text similarity.                  

"""
from loguru import logger
import asyncio
from src.database.neo4j_client import neo4j_client
from src.core.memory import memory

class TopicLinker:
    """
    Constructs the Associative Memory Graph for Topics.
    """
    async def create_predictive_link(self, current_topic_id: str, previous_topic_id: str, weight: float = 1.0):
        """
        Creates a [:LEADS_TO] edge automatically when user shifts from Prev->Current.
        This captures the user's "train of thought" in the graph.
        """
        if not previous_topic_id or not current_topic_id or previous_topic_id == current_topic_id:
            return False

        logger.info(f" [TopicLinker] Generating predictive link: ({previous_topic_id}) -> ({current_topic_id})")
        
        query = """
        MATCH (t1:TopicNeuron {id: $prev}), (t2:TopicNeuron {id: $curr})
        MERGE (t1)-[r:LEADS_TO]->(t2)
        ON CREATE SET r.weight = $w, r.created_at = timestamp()
        ON MATCH SET r.weight = r.weight + $w, r.updated_at = timestamp()
        RETURN r
        """
        await neo4j_client.run_write(query, prev=previous_topic_id, curr=current_topic_id, w=weight)
        return True

    async def detect_semantic_overlap(self, topic_id: str, topic_name: str, org_id: str, threshold: float = 0.85):
        """
        Uses vector similarity to find and link related topics globally.
        This dissolves "knowledge silos" by bridging disparate conversation threads.
        """
        logger.debug(f" [TopicLinker] Analyzing semantic overlap for topic: {topic_name} ({topic_id})")
        
        # 1. Fetch similar topics from Qdrant
        # Note: We use the topic name/summary as the query
        matches = await memory.query_similar(topic_name, n_results=5, collection_name="global_topics")
        
        links_created = 0
        for match in matches:
            peer_id = match.get("id")
            score = match.get("score", 0)
            
            if peer_id == topic_id or score < threshold:
                continue
                
            # 2. Forge the [:SIMILAR_TO] edge in Neo4j
            logger.info(f" [TopicLinker] Bridging concepts: {topic_id} <--(similarity: {score:.2f})--> {peer_id}")
            
            query = """
            MATCH (t1:TopicNeuron {id: $id1}), (t2:TopicNeuron {id: $id2})
            MERGE (t1)-[r:SIMILAR_TO]-(t2)
            SET r.similarity = $score, r.updated_at = timestamp()
            RETURN r
            """
            await neo4j_client.run_write(query, id1=topic_id, id2=peer_id, score=float(score))
            links_created += 1
            
        return links_created

topic_linker = TopicLinker()
