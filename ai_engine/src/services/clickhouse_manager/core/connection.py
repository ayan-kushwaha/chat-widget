"""
Core Connection pooling for ClickHouse Manager.
Handling basic analytical storage connection.
"""
import clickhouse_connect
from src.core.config import settings
from loguru import logger

class ClickHouseConnectionManager:
    def __init__(self):
        self.client = None
        
    def connect(self):
        try:
            import sys
            print(f"DEBUG CONNECTION: user={settings.CLICKHOUSE_USER}, host={settings.CLICKHOUSE_HOST}, port={settings.CLICKHOUSE_PORT}"); sys.stdout.flush()
            kwargs = {
                "host": settings.CLICKHOUSE_HOST,
                "port": settings.CLICKHOUSE_PORT,
                "username": settings.CLICKHOUSE_USER,
                "database": settings.CLICKHOUSE_DB  # Connect directly to target
            }
            if settings.CLICKHOUSE_PASSWORD:
                kwargs["password"] = settings.CLICKHOUSE_PASSWORD
                
            self.client = clickhouse_connect.get_client(**kwargs)
            # Ensure tables exist
            self._ensure_tables()
            logger.info("Connected to High-Performance ClickHouse Engine (Analytics Vault)")
        except Exception as e:
            logger.error(f"ClickHouse connection failed: {e}")
            self.client = None

    def _ensure_tables(self):
        db = settings.CLICKHOUSE_DB
        # Archived chat memories (The Skeleton Vault)
        self.client.command(f'''
            CREATE TABLE IF NOT EXISTS {db}.archived_memories (
                org_id String,
                topic_id String,
                title String,
                summary String,
                importance_score Float32,
                archived_at DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY (org_id, archived_at)
        ''')
        # Psychology MRI Tracking (P1-P8 History)
        self.client.command(f'''
            CREATE TABLE IF NOT EXISTS {db}.psych_history (
                user_id String,
                timestamp DateTime DEFAULT now(),
                p1_mood Int8,
                p2_rapport Int8,
                p3_chameleon Int8,
                p4_anticipator Int8,
                p5_value_discovery Int8,
                p6_pain_spot Int8,
                p7_topic_anchor String,
                p8_loyalty Int8,
                context String
            ) ENGINE = MergeTree()
            ORDER BY (user_id, timestamp)
        ''')

    def get_client(self):
        if not self.client:
            self.connect()
        return self.client

ch_connection = ClickHouseConnectionManager()
