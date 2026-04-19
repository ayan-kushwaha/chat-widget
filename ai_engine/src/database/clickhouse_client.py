"""
 CLICKHOUSE CLIENT  The Analytical Memory Vault
Cluaiz Neural OS | database/clickhouse_client.py

Handles: Permanent Archival of Topics, Summaries, and Hot/Cold transitions.
"""
import clickhouse_connect
from src.core.config import settings
from loguru import logger

class ClickHouseClient:
    def __init__(self):
        self.client = None
        
    def connect(self):
        try:
            self.client = clickhouse_connect.get_client(
                host=settings.CLICKHOUSE_HOST,
                port=settings.CLICKHOUSE_PORT,
                username=settings.CLICKHOUSE_USER,
                database=None # Connect without DB first to create it
            )
            self.client.command(f"CREATE DATABASE IF NOT EXISTS {settings.CLICKHOUSE_DB}")
            self.client.command(f"USE {settings.CLICKHOUSE_DB}")
            
            # Ensure schema exists
            self.client.command('''
                CREATE TABLE IF NOT EXISTS archived_memories (
                    org_id String,
                    topic_id String,
                    title String,
                    summary String,
                    importance_score Float32,
                    archived_at DateTime DEFAULT now()
                ) ENGINE = MergeTree()
                ORDER BY (org_id, archived_at)
            ''')
            logger.info(" Connected to ClickHouse Analytical Engine (Cold Memory)")
        except Exception as e:
            logger.error(f" ClickHouse connection failed: {e}")
            self.client = None

    def archive_memory(self, org_id: str, topic_id: str, title: str, summary: str, score: float = 1.0):
        if not self.client:
            self.connect()
        if not self.client: return False
        
        try:
            self.client.insert('archived_memories', 
                [[org_id, topic_id, title, summary, score]],
                column_names=['org_id', 'topic_id', 'title', 'summary', 'importance_score']
            )
            logger.success(f" [ClickHouse] Archived Topic:{topic_id} permanently.")
            return True
        except Exception as e:
            logger.error(f" ClickHouse archival failed: {e}")
            return False

    def query_history(self, org_id: str, query_filter: str = ""):
        if not self.client: self.connect()
        if not self.client: return []
        
        sql = f"SELECT topic_id, title, summary FROM archived_memories WHERE org_id = '{org_id}'"
        if query_filter:
            sql += f" AND (title LIKE '%{query_filter}%' OR summary LIKE '%{query_filter}%')"
        
        return self.client.query(sql).result_rows

ch_client = ClickHouseClient()
