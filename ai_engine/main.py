import uvicorn
import os
import sys
import asyncio
from dotenv import load_dotenv

# ⚡ CRITICAL: Load .env FIRST before any other imports
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.api.router import router
from src.database.mongo import db
from src.database.neo4j_client import neo4j_client
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DBs
    db.connect()
    await neo4j_client.connect()
    
    # Pre-load ML Models (0.02s promise)
    # from src.services.ai.ambiguity_engine import get_model
    # get_model()

    # 🌍 Bootstrap Global Skill Registry
    from src.services.aiskills.engine.loader import bootstrap_skills
    await bootstrap_skills()
    
    yield
    # Shutdown: Close connections
    await neo4j_client.close()

# FIX: Force ProactorLoop on Windows for Playwright/Subprocesses
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print(f"🔥 UNHANDLED ERROR: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e), "trace": traceback.format_exc()}
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.API_V1_STR)

# Serve Static Files (Audio/Common)
os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
