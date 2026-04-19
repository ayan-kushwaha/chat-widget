"""
Brain Heat Map Tracker  Real-Time Neural Zone Activity
Cluaiz Neural OS | clickhouse_manager/analytics/heat_map.py

Role: Records real-time activation "heat" for Neo4j zones (Psychology, Knowledge, Topic).
This creates a historical MRI playback  seeing which brain zones were most active over time.
"""
from loguru import logger
from src.services.clickhouse_manager.core.connection import ch_connection
from src.database.neo4j_client import neo4j_client
from src.core.config import settings
from typing import Dict, Any


class BrainHeatMap:
    """
    Manages the Neural Heat Index system.
    - Increments heat_index on topic/psychology nodes whenever they are accessed.
    - Syncs the heat snapshot to ClickHouse for historical MRI playback.
    """

    def _table(self):
        return f"{settings.CLICKHOUSE_DB}.archived_memories"

    async def activate(self, node_id: str, node_label: str, org_id: str, amount: float = 1.0):
        """
        Called whenever a node is accessed or referenced. Increments the heat_index in Neo4j.
        """
        try:
            await neo4j_client.run_write(
                f"MATCH (n:{node_label} {{gid: $gid, org_id: $oid}}) "
                f"SET n.heat_index = coalesce(n.heat_index, 0) + $amt",
                gid=node_id, oid=org_id, amt=amount
            )
        except Exception as e:
            logger.warning(f"⚠️ [HeatMap] Could not activate heat for {node_label}:{node_id}: {e}")

    async def decay_all(self, org_id: str, decay_rate: float = 0.1):
        """
        The Brain Cooling Service  reduces all heat_index values by a fraction.
        Should be called by a background scheduler (hourly).
        """
        logger.info(f"❄️ [Heat Decay] Cooling neural graph for Org:{org_id}...")
        await neo4j_client.run_write(
            "MATCH (n) WHERE n.org_id = $oid AND n.heat_index > 0 "
            "SET n.heat_index = n.heat_index * (1 - $rate)",
            oid=org_id, rate=decay_rate
        )

    def get_hot_zones(self, top_n: int = 10) -> Dict[str, Any]:
        """
        Queries the warmest nodes across the graph for the MRI dashboard.
        """
        client = ch_connection.get_client()
        if not client:
            return {"status": "Disconnected"}
        try:
            res = client.query(
                f"SELECT org_id, topic_id, importance_score "
                f"FROM {self._table()} ORDER BY importance_score DESC LIMIT {top_n}"
            )
            return {
                "status": "ok",
                "hot_zones": [{"org_id": r[0], "topic_id": r[1], "score": r[2]} for r in res.result_rows]
            }
        except Exception as e:
            logger.error(f"❌ [HeatMap] Get hot zones failed: {e}")
            return {"status": "error"}


brain_heat = BrainHeatMap()
