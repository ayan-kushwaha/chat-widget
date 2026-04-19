"""
Psychology MRI Recorder  P1-P8 History Logging
Cluaiz Neural OS | clickhouse_manager/analytics/psych_mri.py

Role: Records every single Psychology state shift to ClickHouse so that
we can analyze user behavior patterns over time  like an MRI of the mind.
"""
from loguru import logger
from src.services.clickhouse_manager.core.connection import ch_connection
from src.core.config import settings
from typing import List, Dict, Any

TABLE = lambda: f"{settings.CLICKHOUSE_DB}.psych_history"


class PsychMRIRecorder:
    """
    Records user psychology state shifts into ClickHouse psych_history table.
    Enables long-term behavioral pattern analysis (P1-P8 MRI).
    """

    def log_psychology_state(
        self,
        user_id: str,
        p1_mood: int,
        p2_rapport: int,
        p3_chameleon: int,
        p4_anticipator: int,
        p5_value_discovery: int,
        p6_pain_spot: int,
        p7_topic_anchor: str,
        p8_loyalty: int,
        context: str = ""
    ) -> bool:
        """Push a complete P1-P8 snapshot. Called after every PsychologyManager update."""
        client = ch_connection.get_client()
        if not client:
            return False
        try:
            client.insert(
                TABLE(),
                [[
                    user_id, p1_mood, p2_rapport, p3_chameleon,
                    p4_anticipator, p5_value_discovery, p6_pain_spot,
                    p7_topic_anchor, p8_loyalty, context
                ]],
                column_names=[
                    'user_id', 'p1_mood', 'p2_rapport', 'p3_chameleon',
                    'p4_anticipator', 'p5_value_discovery', 'p6_pain_spot',
                    'p7_topic_anchor', 'p8_loyalty', 'context'
                ]
            )
            logger.success(f"🧠 [Psych MRI] State shift logged for User:{user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ [Psych MRI] Logging failed: {e}")
            return False

    def get_user_trend(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Gets the psychology trend for a user over the last N days.
        Used to detect patterns like: 'User gets stressed when Payment topic comes up.'
        """
        client = ch_connection.get_client()
        if not client:
            return []
        try:
            res = client.query(
                f"SELECT timestamp, p1_mood, p2_rapport, p7_topic_anchor, p8_loyalty "
                f"FROM {TABLE()} "
                f"WHERE user_id = '{user_id}' "
                f"AND timestamp >= now() - INTERVAL {days} DAY "
                f"ORDER BY timestamp ASC"
            )
            return [
                {
                    "timestamp": str(r[0]),
                    "p1_mood": r[1],
                    "p2_rapport": r[2],
                    "p7_topic_anchor": r[3],
                    "p8_loyalty": r[4]
                }
                for r in res.result_rows
            ]
        except Exception as e:
            logger.error(f"❌ [Psych MRI] Trend query failed: {e}")
            return []


psych_mri = PsychMRIRecorder()
