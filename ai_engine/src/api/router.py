from fastapi import APIRouter
from src.api import v1_chat, v1_docs, v1_automations, v1_knowledge, v1_voice, v1_chat_analysis, v1_system, v1_workforce, v1_graph
from routers import upload

router = APIRouter()

router.include_router(v1_chat.router, prefix="/chat", tags=["AI Chat"])
router.include_router(v1_docs.router, prefix="/docs", tags=["Documents (Vision)"])
router.include_router(v1_automations.router, prefix="/automations", tags=["Automations (Tools)"])
router.include_router(v1_knowledge.router, prefix="/knowledge", tags=["Knowledge (Crawling)"])
router.include_router(v1_voice.router, prefix="/voice", tags=["Voice Engine"])
router.include_router(v1_chat_analysis.router, prefix="/analysis", tags=["Intelligence Engine"])
router.include_router(v1_system.router, prefix="/system", tags=["System (Admin)"])
router.include_router(v1_workforce.router, prefix="/workforce", tags=["Workforce Ritual"])
router.include_router(v1_graph.router, prefix="/graph", tags=["Neural Graph"])

# ClickHouse Manager  Isolated Analytical & Vault Routers
from src.api.routes.clickhouse.vault_router import router as vault_router
from src.api.routes.clickhouse.analytics_router import router as analytics_router
router.include_router(vault_router)
router.include_router(analytics_router)

router.include_router(upload.router, tags=["Upload"])  # Upload assets

