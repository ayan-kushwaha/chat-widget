"""
 NEURAL METABOLISM MANAGER  The Life-Cycle Arbiter
Cluaiz Neural OS | services/neural/metabolism/metabolism_manager.py

Handles: Tiered TTL, Average Aging, and Unified Cross-System Purge.
"""
import time
from typing import List, Dict, Any, Optional
from loguru import logger

from src.database.neo4j_client import neo4j_client
from src.services.clickhouse_manager.vault.archiver import archiver as ch_archiver
from src.core.vector_store import vector_store
from src.core.db.mongodb import get_mongodb
from bson import ObjectId

class MetabolismManager:
    """Coordinates tiered archival across Neo4j, Qdrant, MongoDB, and ClickHouse."""
    
    def calculate_expiry(self, days: int) -> int:
        return int((time.time() + (days * 86400)) * 1000)

    async def judge_survival(self, topic_id: str, org_id: str) -> str:
        """Determines if a topic should be HARD_DELETE or SKELETON_ARCHIVE."""
        query = "MATCH (t:NeuralTopic {gid: $tid, org_id: $oid}) RETURN t.priority_score as score, t.pillar as pillar"
        logger.info(f"--- JUDGE START: {topic_id} in {org_id} ---")
        res = await neo4j_client.run(query, tid=topic_id, oid=org_id)
        if not res: 
            logger.info(f"--- JUDGE FAIL: No NeuralTopic found for {topic_id} ---")
            return "HARD_DELETE"
        
        score = res[0].get("score", 1.0)
        pillar = res[0].get("pillar", "Cognition")
        logger.info(f"--- JUDGE INFO: score={score}, pillar={pillar} ---")
        
        # Survival Threshold: Goal, workforce, or identity topics are kept as skeletons
        if score > 1.5 or pillar in ["Workforce", "Identity", "Goal"]:
            return "SKELETON_ARCHIVE"
        return "HARD_DELETE"

    async def purge_neuron(self, gid: str, org_id: str, label: str, source_id: Optional[str] = None):
        """Unified deletion with Hierarchical Shredding."""
        logger.warning(f"🧬 [Metabolism] Processing {label}:{gid}...")
        
        if label in ["Topic", "NeuralTopic"]:
            strategy = await self.judge_survival(gid, org_id)
            if strategy == "SKELETON_ARCHIVE":
                return await self.shred_to_skeleton(gid, org_id)

        # FULL PURGE Logic (Neo4j, Qdrant, MongoDB)
        await neo4j_client.run_write(
            f"MATCH (n:{label} {{gid: $gid, org_id: $oid}}) DETACH DELETE n",
            gid=gid, oid=org_id
        )
        if label in ["Topic", "NeuralTopic", "TopicNeuron"]:
            coll = "global_topics"
            await vector_store.delete_by_ids(coll, [gid])
        
        if source_id:
            try:
                db = await get_mongodb()
                coll = "conversations" if label == "Episode" else "knowledge_sources"
                await db[coll].delete_one({"_id": ObjectId(source_id)})
            except Exception as e:
                logger.error(f" MongoDB source purge failed: {e}")

    async def shred_to_skeleton(self, topic_id: str, org_id: str):
        """Archives summary to ClickHouse and strips Neo4j of 'Flesh'."""
        logger.info(f"--- SHRED START: {topic_id} in {org_id} ---")
        query = "MATCH (t:NeuralTopic {gid: $tid, org_id: $oid}) RETURN t.name as title, t.summary as summary, t.priority_score as score"
        res = await neo4j_client.run(query, tid=topic_id, oid=org_id)
        if not res:
            logger.info(f"--- SHRED FAIL: Topic node not found for {topic_id} ---")
            return
        
        title, summary, score = res[0].get("title"), res[0].get("summary"), res[0].get("score")
        logger.info(f"--- SHRED INFO: title='{title}', summary='{summary[:20] if summary else 'NONE'}', score={score} ---")
        
        if not summary: 
            logger.info(f"🦴 [Metabolism] Topic:{topic_id} already shredded or has no summary.")
            return
        
        # 1. Archive to ClickHouse Vault (Modular Cold Storage)
        archived = ch_archiver.archive_memory(org_id, topic_id, title, summary, score)
        
        if archived:
            # 2. Shred Neo4j (Keep Title, Delete Summary & Linked Episodes)
            logger.info(f"✂️ [Metabolism] Shredding flesh from Topic:{topic_id}...")
            await neo4j_client.run_write(
                "MATCH (t:NeuralTopic {gid: $tid, org_id: $oid}) "
                "SET t.summary = '[ARCHIVED_IN_CLICKHOUSE]', t.details_purged = true, t.archived_in_ch = true "
                "WITH t OPTIONAL MATCH (t)<-[:IN_TOPIC]-(e:EpisodeNeuron) DETACH DELETE e",
                tid=topic_id, oid=org_id
            )
            # 3. Clear Qdrant Vectors (Skeleton isn't vector-searchable)
            await vector_store.delete_by_ids("global_topics", [topic_id])
            logger.success(f"🦴 [Metabolism] Topic:{topic_id} reduced to permanent SKELETON.")

    async def update_topic_lifecycle(self, topic_id: str, org_id: str):
        """Re-calculates a Topic's expiry based on the average TTL of its episodes."""
        query = """
        MATCH (t:NeuralTopic {gid: $tid, org_id: $oid})
        OPTIONAL MATCH (t)<-[:IN_TOPIC]-(e:EpisodeNeuron)
        RETURN avg(e.ttl_days) as avg_ttl
        """
        records = await neo4j_client.run(query, tid=topic_id, oid=org_id)
        
        if records and records[0]["avg_ttl"]:
            avg_days = int(records[0]["avg_ttl"])
            new_expiry = self.calculate_expiry(avg_days)
            
            await neo4j_client.run_write(
                "MATCH (t:NeuralTopic {gid: $tid, org_id: $oid}) SET t.ttl_days = $days, t.expiry_ts = $ts",
                tid=topic_id, oid=org_id, days=avg_days, ts=new_expiry
            )
            logger.info(f"🧬 [Metabolism] Updated Topic:{topic_id} TTL to {avg_days} days.")

metabolism_manager = MetabolismManager()
