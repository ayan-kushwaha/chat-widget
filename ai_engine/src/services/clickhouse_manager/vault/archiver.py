from loguru import logger
from src.services.clickhouse_manager.core.connection import ch_connection
from src.core.config import settings


class MemoryArchiver:
    """Archives high-value topic summaries permanently into ClickHouse."""

    def _table(self):
        return f"{settings.CLICKHOUSE_DB}.archived_memories"

    def archive_memory(self, org_id: str, topic_id: str, title: str, summary: str, score: float = 1.0) -> bool:
        client = ch_connection.get_client()
        if not client:
            print("--- ARCHIVER FAIL: No ClickHouse client ---")
            return False
        try:
            print(f"--- ARCHIVER START: Inserting {topic_id} via RAW SQL ---")
            sql = f"""
                INSERT INTO {self._table()} 
                (org_id, topic_id, title, summary, importance_score) 
                VALUES 
                ('{org_id}', '{topic_id}', '{title.replace("'", "''")}', '{summary.replace("'", "''")}', {float(score)})
            """
            client.command(sql)
            logger.success(f"📦 [CH Vault] Archived Topic:{topic_id} permanently.")
            logger.success(f"📦 [CH Vault] Archived Topic:{topic_id} permanently.")
            return True
        except Exception as e:
            logger.error(f"❌ [CH Vault] Archival failed: {e}")
            return False

    def query_history(self, org_id: str, query_filter: str = ""):
        client = ch_connection.get_client()
        if not client:
            return []
        sql = f"SELECT topic_id, title, summary FROM {self._table()} WHERE org_id = '{org_id}'"
        if query_filter:
            sql += f" AND (title LIKE '%{query_filter}%' OR summary LIKE '%{query_filter}%')"
        return client.query(sql).result_rows


archiver = MemoryArchiver()
