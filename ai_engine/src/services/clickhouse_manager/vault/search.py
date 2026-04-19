from loguru import logger
from src.services.clickhouse_manager.core.connection import ch_connection
from src.core.config import settings
from typing import List, Dict, Any

TABLE = lambda: f"{settings.CLICKHOUSE_DB}.archived_memories"


class VaultSearch:
    """High-speed full-text search across millions of archived memories."""

    def search(self, query_string: str, limit: int = 20) -> List[Dict[str, Any]]:
        client = ch_connection.get_client()
        if not client:
            return []
        try:
            res = client.query(
                f"SELECT org_id, topic_id, title, summary, importance_score, archived_at "
                f"FROM {TABLE()} "
                f"WHERE title ILIKE '%{query_string}%' OR summary ILIKE '%{query_string}%' "
                f"LIMIT {limit}"
            )
            return [
                {
                    "org_id": r[0],
                    "topic_id": r[1],
                    "title": r[2],
                    "summary": r[3],
                    "score": r[4],
                    "archived_at": str(r[5])
                }
                for r in res.result_rows
            ]
        except Exception as e:
            logger.error(f"❌ [CH Search] Query failed: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        client = ch_connection.get_client()
        if not client:
            return {"status": "Disconnected"}
        try:
            total = client.command(f"SELECT count() FROM {TABLE()}")
            top_orgs = client.query(
                f"SELECT org_id, count() as c FROM {TABLE()} GROUP BY org_id ORDER BY c DESC LIMIT 5"
            )
            return {
                "status": "Healthy",
                "total_archived_memories": int(total),
                "top_orgs": [{"org_id": r[0], "count": r[1]} for r in top_orgs.result_rows]
            }
        except Exception as e:
            logger.error(f"❌ [CH Stats] Failed: {e}")
            return {"status": "Error", "message": str(e)}


vault_search = VaultSearch()
