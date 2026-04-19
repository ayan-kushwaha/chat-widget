"""
Analytics Router  Psychology MRI & Heat Map Endpoints
Cluaiz Neural OS | api/routes/clickhouse/analytics_router.py
"""
from fastapi import APIRouter
from src.services.clickhouse_manager.analytics.psych_mri import psych_mri
from src.services.clickhouse_manager.analytics.heat_map import brain_heat

router = APIRouter(prefix="/ch/analytics", tags=["CH Analytics"])

@router.get("/psych-trend/{user_id}")
def get_psychology_trend(user_id: str, days: int = 30):
    """Returns P1-P8 psychology shift history for a user (The MRI scan)."""
    return {"trend": psych_mri.get_user_trend(user_id, days)}

@router.get("/hot-zones")
def get_hot_zones(top_n: int = 10):
    """Returns the most actively interacted topic zones (Brain Heat Map)."""
    return brain_heat.get_hot_zones(top_n)
