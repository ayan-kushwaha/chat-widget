import redis
import os
import json
import time
from typing import Dict, Any, Optional
from loguru import logger

class LedgerService:
    """
    The Atomic Nervous System of the Workforce.
    Handles locks, schema validation, and cross-agent synchronization.
    """

    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)

    def acquire_atomic_lock(self, resource_id: str, timeout: int = 10) -> bool:
        """Prevents race conditions by locking a specific business process."""
        lock_key = f"lock:{resource_id}"
        return self.r.set(lock_key, "LOCKED", ex=timeout, nx=True)

    def release_atomic_lock(self, resource_id: str):
        """Releases the lock after a successful handshake."""
        self.r.delete(f"lock:{resource_id}")

    def perform_handshake(self, sender_role: str, receiver_role: str, data: Dict[str, Any]) -> bool:
        """
        Validates that data schema matches what the receiver expects.
        Example: Rocky (Sales) -> Lakshmi (Finance)
        """
        # Define Handshake Schemas (Abstract Contracts)
        contracts = {
            "Sales_to_Finance": ["deal_id", "total_amount", "currency", "customer_email"],
            "Support_to_Ops": ["ticket_id", "product_id", "issue_type"]
        }
        
        contract_key = f"{sender_role.capitalize()}_to_{receiver_role.capitalize()}"
        required_keys = contracts.get(contract_key, [])
        
        if not required_keys:
            logger.warning(f"No specific handshake contract found for {contract_key}. Proceeding with default.")
            return True
            
        missing_keys = [k for k in required_keys if k not in data]
        if missing_keys:
            logger.error(f"Handshake Failed! Missing keys: {missing_keys} for {contract_key}")
            return False
            
        logger.info(f" Handshake Successful: {sender_role} -> {receiver_role}")
        return True

    def broadcast_knowledge(self, key: str, value: Any):
        """Share a newly discovered business rule across all agents."""
        rule_key = f"rule:{key}"
        self.r.set(rule_key, json.dumps(value))
        logger.info(f" Global Rule Broadcast: {key} is now {value}")

    def get_global_rule(self, key: str) -> Optional[Any]:
        """Fetch a shared rule from the Ledger."""
        val = self.r.get(f"rule:{key}")
        return json.loads(val) if val else None

# Singleton
ledger_service = LedgerService()
