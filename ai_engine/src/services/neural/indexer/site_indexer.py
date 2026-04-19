"""

    SITE INDEXER                                                
  Cluaiz Neural OS | services/neural/indexer/site_indexer.py      
                                                                  
  MongoDB: cluaiz > site_page_indexes > pages[]                   
  Handles: Crawled website pages                                  

"""

import asyncio
import time
import yaml
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from .base import build_node
from src.services.neural.graph.page_syncer import page_syncer
from src.database.neo4j_client import neo4j_client


class SiteIndexer:
    """
    Indexes website pages into site_page_indexes collection.
    """

    async def index(
        self,
        chunks:     list[str],
        doc_id:     str,
        org_id:     str,
        filename:   str,        # page URL
        db:         AsyncIOMotorDatabase,
        vector_ids: Optional[list[str]] = None,
    ) -> dict:
        t_start = time.perf_counter()
        logger.info(f" [SiteIndexer] Indexing page '{filename}' ({len(chunks)} chunks)")

        #  Build YAML nodes via Qwen 
        sem = asyncio.Semaphore(2)

        async def process(i, text):
            async with sem:
                vid = vector_ids[i] if vector_ids and i < len(vector_ids) else None
                chunk_dict = {
                    "raw_title":  f"Chunk {i+1}",
                    "body":       text[:3000],
                    "level":      2,
                    "word_count": len(text.split()),
                }
                try:
                    return await build_node(chunk_dict, index=i, vector_id=vid)
                except Exception as e:
                    logger.warning(f" [SiteIndexer] Chunk {i} failed: {e}")
                    return None

        nodes = [n for n in await asyncio.gather(*[process(i, c) for i, c in enumerate(chunks)]) if n]
        avg_confidence = round(sum(n["confidence"] for n in nodes) / len(nodes) if nodes else 0.5, 3)

        tree_dict = {
            "doc_id":     doc_id,
            "filename":   filename,
            "org_id":     org_id,
            "indexed_at": datetime.now(timezone.utc).isoformat(),
            "confidence": avg_confidence,
            "node_count": len(nodes),
            "tree":       nodes,
        }
        yaml_str = yaml.dump(tree_dict, allow_unicode=True, sort_keys=False, width=120)

        #  Save to MongoDB (site_page_indexes) 
        try:
            source_id = ObjectId(doc_id) if len(str(doc_id)) == 24 else doc_id
            page_data = {
                "url":             filename,
                "page_index":      yaml_str,
                "page_index_meta": {"node_count": len(nodes), "confidence": avg_confidence},
                "vector_ids":      vector_ids or [],
            }

            # Remove old entry for this URL, then push fresh
            await db.site_page_indexes.update_one(
                {"sourceId": source_id},
                {"$pull": {"pages": {"url": filename}}},
                upsert=True
            )
            await db.site_page_indexes.update_one(
                {"sourceId": source_id},
                {
                    "$push": {"pages": page_data},
                    "$set":  {"updatedAt": datetime.now(timezone.utc)},
                    "$setOnInsert": {"orgId": org_id, "createdAt": datetime.now(timezone.utc)},
                },
                upsert=True
            )
            logger.info(f"    [site_page_indexes] Page '{filename}' saved")
        except Exception as e:
            logger.error(f" [SiteIndexer] MongoDB save failed: {e}")

        #  Sync to Neo4j (non-fatal) 
        if neo4j_client.enabled:
            await page_syncer.sync(doc_id, org_id, filename, avg_confidence, len(nodes), yaml_str)

        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        logger.info(f" [SiteIndexer] Done in {duration_ms}ms | {len(nodes)} nodes")

        return {"doc_id": doc_id, "node_count": len(nodes), "confidence": avg_confidence,
                "page_index_yaml": yaml_str, "duration_ms": duration_ms}


site_indexer = SiteIndexer()
