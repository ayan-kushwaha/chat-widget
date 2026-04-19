"""
Worker Launcher - Start training worker to listen to Redis queue
Run this in background: python -m src.workers.training_worker_launcher
"""

import asyncio
import sys
from loguru import logger

# Add parent directory to path
sys.path.insert(0, '/app')

from src.services.workforce.workforce_worker import workforce_worker

if __name__ == "__main__":
    logger.info(" Starting Workforce Worker...")
    asyncio.run(workforce_worker.start_worker())
