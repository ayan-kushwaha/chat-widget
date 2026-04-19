import os
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        print(f" Connected to MongoDB at {settings.MONGO_URI}")

    async def get_user_credentials(self, user_id: str, integration_name: str):
        """
        Fetches encrypted API keys for a specific tool.
        """
        if not self.client:
            raise ConnectionError("Database not connected")
        
        db = self.client.cluaiz
        # Collection: 'integration_credentials'
        creds = await db.integration_credentials.find_one({
            "userId": user_id, 
            "integration": integration_name
        })
        return creds

db = Database()
