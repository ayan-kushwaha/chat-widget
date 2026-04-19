"""

    FILE INDEXER                                                
  Cluaiz Neural OS | services/neural/indexer/file_indexer.py      
                                                                  
  MongoDB: cluaiz > knowledgedocuments > page_index               
  Handles: PDF files, text files, documents                       

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


class FileIndexer:
    """
    Indexes uploaded files (PDFs, text, etc.) into knowledgedocuments.
    """

    async def index(
        self,
        chunks:     list[str],
        doc_id:     str,
        org_id:     str,
        filename:   str,
        db:         AsyncIOMotorDatabase,
        vector_ids: Optional[list[str]] = None,
    ) -> dict:
        t_start = time.perf_counter()
        logger.info(f" [FileIndexer] Indexing '{filename}' ({len(chunks)} chunks)")

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
                    logger.warning(f" [FileIndexer] Chunk {i} failed: {e}")
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

        #  Save to MongoDB (knowledgedocuments) 
        query = self._build_query(doc_id, org_id)
        update = {"$set": {"page_index": yaml_str, "page_index_meta": {"node_count": len(nodes), "confidence": avg_confidence}}}

        try:
            res = await db.knowledgedocuments.update_one(query, update)
            logger.info(f"    [knowledgedocuments] matched={res.matched_count} modified={res.modified_count}")

            if res.matched_count == 0:
                res = await db.documents.update_one(query, update)
            if res.matched_count == 0:
                # ID-only fallback
                res = await db.knowledgedocuments.update_one({"_id": query["_id"]}, update)
                if res.matched_count > 0:
                    logger.info("    [knowledgedocuments] ID-only fallback matched")
        except Exception as e:
            logger.error(f" [FileIndexer] MongoDB save failed: {e}")

        #  Sync to Neo4j (non-fatal) 
        if neo4j_client.enabled:
            await page_syncer.sync(doc_id, org_id, filename, avg_confidence, len(nodes), yaml_str)

        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        logger.info(f" [FileIndexer] Done in {duration_ms}ms | {len(nodes)} nodes")

        return {"doc_id": doc_id, "node_count": len(nodes), "confidence": avg_confidence,
                "page_index_yaml": yaml_str, "duration_ms": duration_ms}

    @staticmethod
    def _build_query(doc_id: str, org_id: str) -> dict:
        query = {}
        try:
            query["_id"] = ObjectId(doc_id) if len(str(doc_id)) == 24 else doc_id
        except Exception:
            query["_id"] = doc_id

        try:
            if len(str(org_id)) == 24:
                query["$or"] = [{"orgId": org_id}, {"orgId": ObjectId(org_id)}]
            else:
                query["orgId"] = org_id
        except Exception:
            query["orgId"] = org_id
        return query


file_indexer = FileIndexer()
