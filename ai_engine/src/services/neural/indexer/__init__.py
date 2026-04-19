"""
Neural Indexer Package
======================
Type-specific indexers for each knowledge base type.

Usage:
    from src.services.neural.indexer import neural_indexer   # backwards compat
    from src.services.neural.indexer.file_indexer import file_indexer
    from src.services.neural.indexer.site_indexer import site_indexer
    from src.services.neural.indexer.manual_indexer import manual_indexer
    from src.services.neural.indexer.api_indexer import api_indexer
"""

from .file_indexer   import file_indexer
from .site_indexer   import site_indexer
from .manual_indexer import manual_indexer
from .api_indexer    import api_indexer

#  Backwards-compat shim 
# Old code: from src.services.neural.indexer import neural_indexer
# neural_indexer.index_document()  routes to correct type-specific indexer

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime, timezone
import asyncio
import time
import yaml
from bson import ObjectId
from loguru import logger


class _BackwardsCompatIndexer:
    """
    Shim so existing callers (doc_service.py, v1_knowledge.py) keep working.
    Maintains ALL the original fallback collection logic from the old indexer.py.
    Adds Neo4j PageNeuron sync via graph/page_syncer after MongoDB save.
    """

    async def index_document(
        self,
        chunks:      list[str],
        doc_id:      str,
        org_id:      str,
        filename:    str,
        db:          AsyncIOMotorDatabase,
        vector_ids:  Optional[list[str]] = None,
        source_type: str = "file",
    ) -> dict:
        t_start = time.perf_counter()
        logger.info(f"  [Indexer] Building page index for '{filename}' ({len(chunks)} chunks)")

        #  Build YAML nodes via Qwen (shared base logic) 
        from .base import build_node
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
                    res = await build_node(chunk_dict, index=i, vector_id=vid)
                    if not res:
                        logger.warning(f" [Indexer] build_node returned None for chunk {i}")
                    return res
                except Exception as e:
                    logger.error(f" [Indexer] Chunk {i} failed critically: {e}")
                    import traceback
                    traceback.print_exc()
                    return None

        nodes = [n for n in await asyncio.gather(*[process(i, c) for i, c in enumerate(chunks)]) if n]
        
        if not nodes and chunks:
            logger.error(f" [Indexer] CRITICAL: Generated 0 nodes for {len(chunks)} chunks! Ensuring fallback...")
            # Emergency fix: if everything failed, at least provide one raw node so page_index isn't empty
            from .base import build_node
            fallback_node = await build_node({"body": chunks[0], "raw_title": "Document Content", "level": 1, "word_count": len(chunks[0].split())}, index=0)
            nodes = [fallback_node]

        avg_confidence = round(sum(n["confidence"] for n in nodes) / len(nodes) if nodes else 0.5, 3)

        #  YAML = ONLY chunks tree (no root wrapper) 
        # Root metadata (doc_id, filename, org_id, etc.) already in MongoDB row
        yaml_str = yaml.dump(nodes, allow_unicode=True, sort_keys=False, width=120)

        #  Build query (flexible ObjectId/string handling) 
        query = {}
        try:
            query["_id"] = ObjectId(doc_id) if len(str(doc_id)) == 24 else doc_id
        except Exception:
            query["_id"] = doc_id

        org_obj_id = None
        try:
            if len(str(org_id)) == 24:
                org_obj_id = ObjectId(org_id)
        except Exception:
            pass

        if org_obj_id:
            query["$or"] = [{"orgId": org_id}, {"orgId": org_obj_id}]
        else:
            query["orgId"] = org_id

        update_payload = {"$set": {
            "page_index":      yaml_str,
            "page_index_meta": {"node_count": len(nodes), "confidence": avg_confidence},
        }}

        #  Save to MongoDB  ALL collections with fallbacks 
        # (Same fallback chain as original indexer.py  nothing removed)
        try:
            # 1. knowledgedocuments (files/PDFs)
            res = await db.knowledgedocuments.update_one(query, update_payload)
            logger.info(f"    [knowledgedocuments] matched={res.matched_count}")

            # 2. site_page_indexes (websites)  consolidated per-page storage
            source_id = ObjectId(doc_id) if len(str(doc_id)) == 24 else doc_id
            page_data = {
                "url":             filename,
                "page_index":      yaml_str,
                "page_index_meta": {"node_count": len(nodes), "confidence": avg_confidence},
                "vector_ids":      vector_ids or [],
            }
            await db.site_page_indexes.update_one(
                {"sourceId": source_id},
                {"$pull": {"pages": {"url": filename}}},
                upsert=True
            )
            res_site = await db.site_page_indexes.update_one(
                {"sourceId": source_id},
                {
                    "$push": {"pages": page_data},
                    "$set":  {"updatedAt": datetime.now(timezone.utc)},
                    "$setOnInsert": {"orgId": org_obj_id or org_id, "createdAt": datetime.now(timezone.utc)},
                },
                upsert=True
            )
            logger.info(f"    [site_page_indexes] page '{filename}' updated")

            # 3. apisources fallback
            if res.matched_count == 0:
                res = await db.apisources.update_one(query, update_payload)
                logger.info(f"    [apisources] matched={res.matched_count}")

            # 4. documents fallback
            if res.matched_count == 0:
                res = await db.documents.update_one(query, update_payload)
                logger.info(f"    [documents] matched={res.matched_count}")

            # 5. manualdocuments fallback
            if res.matched_count == 0:
                res = await db.manualdocuments.update_one(query, update_payload)
                logger.info(f"    [manualdocuments] matched={res.matched_count}")

            # 6. ID-only last resort
            if res.matched_count == 0:
                id_query = {"_id": query["_id"]}
                res = await db.knowledgedocuments.update_one(id_query, update_payload)
                if res.matched_count > 0:
                    logger.info("    [knowledgedocuments] ID-only fallback matched")

        except Exception as e:
            logger.error(f" [Indexer] MongoDB save error: {e}")

        #  Sync to Neo4j PageNeurons (non-fatal) 
        from src.database.neo4j_client import neo4j_client
        if neo4j_client.enabled:
            # Fetch REAL title from MongoDB (not the display_name shortcode)
            doc_title = filename  # fallback
            try:
                _id = ObjectId(doc_id) if len(str(doc_id)) == 24 else doc_id
                for coll_name in ["knowledgedocuments", "manualdocuments", "apisources", "documents"]:
                    row = await db[coll_name].find_one({"_id": _id}, {"title": 1})
                    if row and row.get("title"):
                        doc_title = row["title"]
                        break
            except Exception:
                pass

            from src.services.neural.graph.page_syncer import page_syncer
            await page_syncer.sync(doc_id, org_id, doc_title, avg_confidence, len(nodes), yaml_str)



        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        logger.info(f" [Indexer] '{filename}' done in {duration_ms}ms | {len(nodes)} nodes")

        return {
            "doc_id":          doc_id,
            "node_count":      len(nodes),
            "confidence":      avg_confidence,
            "page_index_yaml": yaml_str,
            "duration_ms":     duration_ms,
        }


neural_indexer = _BackwardsCompatIndexer()

