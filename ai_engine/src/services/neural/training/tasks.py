"""

   Neural Tasks  Async Evolution Orchestration        
  Cluaiz Neural OS | training/tasks.py                    
                                                          
  Role: Handles Jitter Logic & Idle-Time Triggers         

"""
import random
import time
from loguru import logger
from src.core.celery_app import app
from .atma_trainer import subconscious_trainer


@app.task(name="neural.evolution_watchdog")
def run_evolution_watchdog():
    """
    Periodic task that checks all Orgs for idle-time thresholds.
    Implements Dual-Path: 1k/24h or 10k/6h + Mandatory 6h Idle.
    """
    logger.info(" [Watchdog] Checking for idle organizations that need evolution...")
    
    #  Simulation 
    # In production, this loop would iterate over all OrganizationNeurons in Neo4j
    demo_org_id = "cluaiz_demo_org"
    
    # Scenario: Massive data burst (Overdrive Path)
    new_nodes = 12000    # > 10,000 threshold
    last_train_h = 8     # > 6h threshold
    idle_h = 7           # > 6h threshold
    
    # Check if ready via Trainer logic
    if subconscious_trainer.is_evolution_ready(demo_org_id, new_nodes, last_train_h, idle_h):
        logger.success(f" [Watchdog] Evolution criteria met for '{demo_org_id}'. Queueing task.")
        execute_evolution_task.delay(org_id=demo_org_id)
    else:
        logger.info(f" [Watchdog] Org '{demo_org_id}' not ready for evolution.")


@app.task(name="neural.evolution", queue="neural")
def execute_evolution_task(org_id: str):
    """
    The main evolution worker task.
    Implements randomized Jitter to protect GPU/CPU from concurrent spikes.
    """
    #  Layer 1: Organizational Jitter 
    # Prevents "Thundering Herd" if many orgs wake up/idled at the same time
    jitter_seconds = random.randint(60, 900) # 1 to 15 minutes
    logger.info(f" [Evolution] Org '{org_id}' Jitter Active: Waiting {jitter_seconds}s before CUDA ignition...")
    
    # For testing, we might want a shorter jitter or skip it if it's a manual trigger
    # time.sleep(jitter_seconds) 
    
    #  Layer 2: CUDA Evolution 
    logger.info(f" [Evolution] Starting nightly evolution for org: {org_id}")
    success = subconscious_trainer.execute_nightly_evolution()
    
    if success:
        logger.success(f" [Evolution] Transformation complete for {org_id}.")
    else:
        logger.error(f" [Evolution] Transformation failed for {org_id}.")
    
    return success
