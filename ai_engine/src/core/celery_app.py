"""

   Celery Core  Distributed Task Queue Setup           
  Cluaiz AI Engine | core/celery_app.py                   
                                                          
  Role: Asynchronous task orchestration for the Brain     
  Broker: Redis 7.0                                       
  Backend: Redis 7.0                                      

"""
import os
from celery import Celery
from kombu import Exchange, Queue
from loguru import logger

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

app = Celery(
    "cluaiz_brain",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "src.services.neural.training.tasks",
        # Add other background task modules here
    ]
)

#  Celery Config 
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,   # 1 hour max per training session
    
    # Priority Queues
    task_default_queue="default",
    task_queues=(
        Queue("default",   Exchange("default"),  routing_key="default"),
        Queue("neural",    Exchange("neural"),   routing_key="neural"),
        Queue("high_pri",  Exchange("high_pri"), routing_key="high_pri"),
    ),
    
    # Periodic Tasks (Watchdog)
    beat_schedule={
        "idle-time-watchdog": {
            "task": "neural.evolution_watchdog",
            "schedule": 1800.0, # Run every 30 minutes
        },
    }
)

if __name__ == "__main__":
    app.start()
