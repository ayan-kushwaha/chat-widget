"""
 MongoDB Connection Client
============================
Centralized MongoDB client using motor (AsyncIOMotorClient).
"""

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.utils.logger import logger
import asyncio

_mongo_client: AsyncIOMotorClient = None
_db = None

async def get_mongodb():
    """
    Returns an async MongoDB database instance.
    Singleton pattern for connection pooling.
    """
    global _mongo_client, _db
    
    if _db is not None:
        return _db
    
    try:
        logger.info(f" [MongoDB] Connecting to {settings.MONGO_URI}...")
        _mongo_client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=3000,  # 3s timeout  fast fail in dev/test
            connectTimeoutMS=3000,
            socketTimeoutMS=5000,
        )
        # Parse database name from URI or use default
        db_name = settings.MONGO_URI.split('/')[-1] or "cluaiz"
        _db = _mongo_client[db_name]
        
        # Test connection
        await _mongo_client.admin.command('ping')
        logger.success(f" [MongoDB] Connected to database: {db_name}")
        
        return _db
    except Exception as e:
        logger.error(f" [MongoDB] Connection failed: {e}")
        raise e

async def close_mongodb():
    """Close the MongoDB connection pool."""
    global _mongo_client, _db
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _db = None
        logger.info(" [MongoDB] Connection closed.")
