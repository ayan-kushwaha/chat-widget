"""

    PAGE SYNCER  Neo4j PageNeuron Sync                         
  Cluaiz Neural OS | services/neural/graph/page_syncer.py         
                                                                  
  Role: Mirrors YAML page_index (from MongoDB) into Neo4j as      
        lightweight PageNeuron nodes so Shadow Boss can navigate  
        without touching MongoDB.                                 
                                                                  
  Flow:                                                           
    YAML tree (already in MongoDB)  parse  Neo4j PageNeurons   
                                                                  
  Graph:                                                          
    (:Org)-[:HAS_DOCUMENT](:Document)-[:HAS_PAGE](:PageNeuron) 
                                                                  
  MongoDB:  UNCHANGED                                           
  Qdrant:   UNCHANGED                                           

"""

import yaml
from datetime import datetime, timezone
from loguru import logger

from src.database.neo4j_client import neo4j_client


class PageSyncer:
    """
    Syncs YAML page_index nodes into Neo4j as PageNeurons.
    Called after MongoDB save is complete  failure here is non-fatal.
    """

    async def sync(
        self,
        doc_id:     str,
        org_id:     str,
        filename:   str,
        confidence: float,
        node_count: int,
        yaml_str:   str,
    ) -> None:
        """
        Main entry point. Creates Org  Document  PageNeuron graph.

        Args:
            doc_id:     MongoDB document _id (string)
            org_id:     Organisation ID
            filename:   Original filename / URL
            confidence: Average confidence of YAML index
            node_count: Total nodes in YAML tree
            yaml_str:   Raw YAML page_index string (from MongoDB)
        """
        try:
            #  Org node 
            await neo4j_client.merge_node(
                label="Org",
                match_props={"org_id": org_id},
                set_props={"last_updated": datetime.now(timezone.utc).isoformat()},
            )

            #  Document node (title only  summary already in MongoDB) 
            await neo4j_client.merge_node(
                label="Document",
                match_props={"doc_id": doc_id},
                set_props={
                    "title":          filename,   #  Real title from MongoDB
                    "org_id":         org_id,
                    "confidence":     confidence,
                    "node_count":     node_count,
                    "indexed_at":     datetime.now(timezone.utc).isoformat(),
                    "priority_score": confidence,
                    "decay_rate":     0.0,
                },
            )

            #  Org  Document 
            await neo4j_client.merge_relationship(
                from_label="Org",    from_id_key="org_id", from_id_val=org_id,
                to_label="Document", to_id_key="doc_id",   to_id_val=doc_id,
                relation="HAS_DOCUMENT",
                props={"linked_at": datetime.now(timezone.utc).isoformat()},
            )

            logger.info(f"    [PageSyncer] Document node synced: '{filename}' (title only, no summary)")

            #  PageNeurons from YAML tree 
            await self._sync_page_neurons(doc_id, org_id, filename, yaml_str)

        except Exception as e:
            # Must NEVER crash the indexing pipeline
            logger.error(f" [PageSyncer] Neo4j sync failed (non-fatal): {e}")


    async def _sync_page_neurons(
        self, doc_id: str, org_id: str, filename: str, yaml_str: str
    ) -> None:
        """
        Parse YAML tree and create one PageNeuron per chunk.
        Only lightweight nav data goes to Neo4j (node_id + summary + vector_ids).
        Full raw text stays in MongoDB/Qdrant  unchanged.
        """
        if not yaml_str:
            return

        try:
            parsed = yaml.safe_load(yaml_str)
            # Support both flat list (new) and dict with 'tree' key (legacy)
            if isinstance(parsed, list):
                page_nodes = parsed
            elif isinstance(parsed, dict):
                page_nodes = parsed.get("tree", [])
            else:
                page_nodes = []

            if not page_nodes:
                logger.info(f"    [PageSyncer] Empty tree for '{filename}'  skipping PageNeurons")
                return

            synced = 0
            for pnode in page_nodes:
                nid = pnode.get("node_id", "")
                if not nid:
                    continue

                vids = pnode.get("vector_ids", [])

                # Clean metadata for readable Neo4j display
                import re
                raw_summary = str(pnode.get("summary", ""))
                clean_summary = re.sub(r'\*+|#+|`+', '', raw_summary).strip()[:300]
                
                raw_title = str(pnode.get("title", f"Chunk {synced+1}"))
                clean_title = re.sub(r'#+|`+|\*+', '', raw_title).strip()[:100]

                # Only navigation-level data  Neo4j
                await neo4j_client.merge_node(
                    label="PageNeuron",
                    match_props={"node_id": nid},
                    set_props={
                        "doc_id":         doc_id,
                        "org_id":         org_id,
                        "title":          clean_title,   #  NOW SAVED IN NEO4J
                        "summary":        clean_summary,
                        "confidence":     float(pnode.get("confidence", 0.5)),
                        "chunk_index":    int(pnode.get("index", 0)),
                        "vector_ids":     str(vids),
                        "priority_score": float(pnode.get("confidence", 0.5)),
                        "decay_rate":     0.0,
                    },
                )

                # Document  PageNeuron
                await neo4j_client.merge_relationship(
                    from_label="Document",  from_id_key="doc_id",  from_id_val=doc_id,
                    to_label="PageNeuron",  to_id_key="node_id",   to_id_val=nid,
                    relation="HAS_PAGE",
                    props={"chunk_index": int(pnode.get("index", 0))},
                )
                synced += 1

            logger.info(
                f"     [PageSyncer] {synced}/{len(page_nodes)} PageNeurons "
                f"synced for '{filename}' | MongoDB YAML unchanged"
            )

        except Exception as e:
            logger.warning(f"  [PageSyncer] PageNeuron creation failed (non-fatal): {e}")


#  Singleton 

page_syncer = PageSyncer()
