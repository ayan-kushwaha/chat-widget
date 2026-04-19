"""
Central API router for Cluaiz AI Engine V2.
All sub-routers are registered here under /api/v1.
"""
from fastapi import APIRouter

from src.api.v1_chat            import router as chat_router
from src.api.v1_whatsapp_webhook import router as whatsapp_router

api_router = APIRouter()

#  Mount sub-routers 
api_router.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat"],
)
api_router.include_router(
    whatsapp_router,
    prefix="/whatsapp",
    tags=["WhatsApp"],
)

@api_router.get("/", tags=["System"])
def root():
    return {"message": "Cluaiz AI Engine V2  API Ready", "version": "2.0.0"}
