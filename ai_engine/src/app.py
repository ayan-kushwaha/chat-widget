"""

    CLUAIZ AI ENGINE  FastAPI Application                                  
  V2 Architecture | Production Wiring                                         
                                                                              
  Startup Lifecycle:                                                          
    1. MongoDB connection (motor async pool).                                 
    2. HITL expiry sweeper (asyncio background task).                         
    3. All API routers registered under /api/v1                               
                                                                              
  Shutdown:                                                                   
    - MongoDB connection pool closed gracefully.                              

"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.core.config import settings
from src.core.db.mongodb import get_mongodb, close_mongodb
from src.core.middlewares import ResourceMetricsMiddleware


#  Lifespan: Startup & Shutdown 

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the full startup and shutdown lifecycle of the AI Engine.

    ON STARTUP:
       Connect to MongoDB (creates async connection pool)
       Start HITL approval expiry sweeper as fire-and-forget background task

    ON SHUTDOWN:
       Cancel the sweeper task cleanly
       Close MongoDB connection pool
    """
    #  STARTUP 
    logger.info(" [Lifespan] AI Engine V2 starting up...")

    # 1. MongoDB
    try:
        await get_mongodb()
        logger.success(" [Lifespan] MongoDB connected.")
        
        # 1.5 Neo4j Database
        from src.database.neo4j_client import neo4j_client
        await neo4j_client.connect()
    except Exception as e:
        logger.error(f" [Lifespan] MongoDB connection failed (non-fatal): {e}")
        logger.warning("  [Lifespan] Running in OFFLINE mode  ApprovalStore using RAM fallback.")

    # 2. HITL Expiry Sweeper  background task (non-blocking)
    from src.services.aiskills.chatwidget.hitl_approval_gate import run_expiry_sweeper
    sweeper_task = asyncio.create_task(run_expiry_sweeper(interval_seconds=60))
    logger.info(" [Lifespan] HITL expiry sweeper started (60s interval).")

    yield  #  App is running 

    #  SHUTDOWN 
    logger.info(" [Lifespan] AI Engine shutting down...")

    # Cancel sweeper gracefully
    sweeper_task.cancel()
    try:
        await sweeper_task
    except asyncio.CancelledError:
        logger.info(" [Lifespan] Expiry sweeper cancelled cleanly.")

    # Close MongoDB pool
    await close_mongodb()
    logger.info(" [Lifespan] MongoDB disconnected.")
    
    # Close Neo4j pool
    from src.database.neo4j_client import neo4j_client
    await neo4j_client.close()


#  Application Factory 

def create_app() -> FastAPI:
    """
    Application Factory Pattern  creates and configures the FastAPI instance.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version="2.0.0",
        description="Cluaiz AI Engine V2  Multi-Agent System with HITL Gate",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    #  CORS 
    # Docker internal network: broad allow is fine. Tighten for public exposure.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(ResourceMetricsMiddleware)

    #  Routers 
    from src.api.routes import api_router

    # Register the main API router (includes all sub-routers)
    app.include_router(api_router, prefix=settings.API_V1_STR)

    #  Health check 
    @app.get("/health", tags=["System"])
    async def health_check():
        """
        Quick liveness probe for Docker / load balancer health checks.
        Returns MongoDB status for deeper readiness checking.
        """
        from src.core.db.mongodb import _db
        return {
            "status":   "ok",
            "service":  "Cluaiz AI Engine",
            "version":  "2.0.0",
            "mongo":    "connected" if _db is not None else "offline (fallback mode)",
        }

    return app


app = create_app()

