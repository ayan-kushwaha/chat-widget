"""

    SHADOW BOSS SECURITY MONITOR  Pillar E                                
  The Central Nervous System for All Security Events.                         
                                                                              
  Role:    Receives, stores, and alerts on security events from:              
              Bouncer      (prompt injection attempts)                       
              Gatekeeper   (role bypass attempts, unknown roles)             
              The Judge    (critical Protocol Card violations)               
                                                                              
  Architecture:                                                               
     Singleton  one monitor instance per ai_engine process.                 
     In-memory ring buffer (deque) + optional Redis persistence.             
     Async-ready  non-blocking. Never slows down the hot path.              
     Threshold-based auto-alert  repeated attacks trigger Boss notify.      
     WebSocket push hook (ready for real-time Boss dashboard).               
                                                                              
  Storage Strategy:                                                           
    Tier 1: In-memory deque (last 500 events, instant query)                  
    Tier 2: MongoDB   (persistent, queryable by business_id + date)           
    Tier 3: Redis     (real-time pub/sub for dashboard push; optional)        

"""

from __future__ import annotations

import asyncio
import os
from collections import deque, defaultdict
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional
from loguru import logger


#  Constants 

_RING_BUFFER_SIZE     = 500       # Max events held in RAM per process
_ALERT_WINDOW_SECONDS = 300       # 5-minute sliding window for threshold checks
_MONGO_COLLECTION     = "shadow_boss_security_events"

# Thresholds  N events of TYPE within window  alert Boss
_ALERT_THRESHOLDS: Dict[str, int] = {
    "prompt_injection_detected":   3,   # 3 injections  alert
    "owner_action_attempt":        3,   # Customer trying owner-only actions
    "unknown_role_detected":       1,   # Any unknown role = immediate alert
    "critical_card_violated":      1,   # Judge: critical card = immediate alert
    "judge_block":                 5,   # 5 Judge BLOCKs in window
    "role_bypass":                 2,   # 2 bypass attempts  alert
    "high_threat_score":           5,   # Bouncer WARN accumulation
}

# Severity map for event_type  log level
_SEVERITY: Dict[str, str] = {
    "unknown_role_detected":     "CRITICAL",
    "critical_card_violated":    "CRITICAL",
    "prompt_injection_detected": "HIGH",
    "owner_action_attempt":      "HIGH",
    "role_bypass":               "HIGH",
    "judge_block":               "MEDIUM",
    "high_threat_score":         "MEDIUM",
    "bouncer_warn":              "LOW",
    "judge_warn":                "LOW",
}


#  Security Event Model 

class SecurityEvent:
    """
    Lightweight, slot-optimised security event record.
    Created and stored for every security signal from Bouncer / Gatekeeper / Judge.
    """
    __slots__ = (
        "event_id", "event_type", "severity", "user_id", "business_id",
        "employee_id", "session_id", "action", "role", "detail",
        "timestamp", "alerted"
    )

    def __init__(
        self,
        event_type:  str,
        user_id:     str               = "anonymous",
        business_id: str               = "",
        employee_id: str               = "",
        session_id:  str               = "",
        action:      str               = "",
        role:        str               = "",
        detail:      Dict[str, Any]    = None,
    ):
        import uuid
        self.event_id    = str(uuid.uuid4())[:12]
        self.event_type  = event_type
        self.severity    = _SEVERITY.get(event_type, "LOW")
        self.user_id     = user_id
        self.business_id = business_id
        self.employee_id = employee_id
        self.session_id  = session_id
        self.action      = action
        self.role        = role
        self.detail      = detail or {}
        self.timestamp   = datetime.now(timezone.utc)
        self.alerted     = False   # True once Boss has been notified


    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id":    self.event_id,
            "event_type":  self.event_type,
            "severity":    self.severity,
            "user_id":     self.user_id,
            "business_id": self.business_id,
            "employee_id": self.employee_id,
            "session_id":  self.session_id,
            "action":      self.action,
            "role":        self.role,
            "detail":      self.detail,
            "timestamp":   self.timestamp.isoformat(),
            "alerted":     self.alerted,
        }

    def __repr__(self) -> str:
        return (
            f"<SecurityEvent [{self.severity}] {self.event_type} | "
            f"user={self.user_id} | action={self.action} | {self.timestamp.strftime('%H:%M:%S')}>"
        )


#  Shadow Boss Security Monitor (Singleton) 

class ShadowBossMonitor:
    """
     The Shadow Boss Security Monitor  Singleton.

    Instantiated ONCE at process start. All security contracts call:
        shadow_boss_monitor.log_security_event(payload_dict)

    The monitor is entirely non-blocking:
        - Synchronous call from Gatekeeper / Judge (no await needed)
        - Async persistence (MongoDB + Redis) fires in background tasks
        - Boss alert (WebSocket / WhatsApp) fires in background task

    Usage (from any skill):
        from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
        shadow_boss_monitor.log_security_event({
            "event_type":  "owner_action_attempt",
            "user_id":     "u_hash_abc123",
            "action":      "view_daily_revenue",
            "role":        "customer",
            "business_id": "biz_xyz",
            "employee_id": "rocky",
            "session_id":  "sess_001",
        })
    """

    _instance: Optional[ShadowBossMonitor] = None

    def __new__(cls) -> ShadowBossMonitor:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False
        return cls._instance

    def __init__(self):
        if self._initialised:
            return
        self._initialised = True

        # Tier 1: In-memory ring buffer
        self._events: Deque[SecurityEvent] = deque(maxlen=_RING_BUFFER_SIZE)

        # Per-user attack counter: {user_id: {event_type: [timestamps]}}
        self._attack_counters: Dict[str, Dict[str, List[datetime]]] = defaultdict(
            lambda: defaultdict(list)
        )

        # WebSocket push callbacks registered by the API layer
        # Signature: async def callback(event: dict) -> None
        self._ws_callbacks: List[Any] = []

        # Redis client (optional  initialised lazily)
        self._redis = None
        self._mongo_db = None

        logger.info(" [ShadowBossMonitor] Initialised. Ring buffer ready (capacity=500).")

    #  Public API  called synchronously from skill layer 

    def log_security_event(self, payload: Dict[str, Any]) -> SecurityEvent:
        """
        Primary entry point. Called synchronously by Gatekeeper, Bouncer, Judge.

        Accepts the flat payload dict format used by all security contracts:
            {
                "event_type":  str,
                "user_id":     str,
                "action":      str,
                "role":        str,
                "business_id": str,
                "employee_id": str,
                "session_id":  str,
                "detail":      dict  (optional extra metadata)
            }

        Returns the SecurityEvent created (for testing / chaining).
        """
        event = SecurityEvent(
            event_type  = payload.get("event_type",  "unknown"),
            user_id     = payload.get("user_id",     "anonymous"),
            business_id = payload.get("business_id", ""),
            employee_id = payload.get("employee_id", ""),
            session_id  = payload.get("session_id",  ""),
            action      = payload.get("action",      ""),
            role        = payload.get("role",        ""),
            detail      = payload.get("detail",      {}),
        )

        # Store in ring buffer
        self._events.append(event)

        # Update attack counters for threshold check
        self._record_attack(event)

        # Structured log (always synchronous  zero latency impact)
        self._log_event(event)

        # Fire async tasks in background (non-blocking)
        self._fire_background(event)

        return event

    #  Threshold-based alerting 

    def _record_attack(self, event: SecurityEvent) -> None:
        """
        Update sliding-window attack counter.
        Purges timestamps older than _ALERT_WINDOW_SECONDS first.
        """
        now     = event.timestamp
        uid     = event.user_id
        etype   = event.event_type
        cutoff  = (now.timestamp() - _ALERT_WINDOW_SECONDS)

        # Purge old timestamps
        self._attack_counters[uid][etype] = [
            ts for ts in self._attack_counters[uid][etype]
            if ts.timestamp() > cutoff
        ]
        self._attack_counters[uid][etype].append(now)

        # Check threshold
        count     = len(self._attack_counters[uid][etype])
        threshold = _ALERT_THRESHOLDS.get(etype)
        if threshold and count >= threshold and not event.alerted:
            event.alerted = True
            self._trigger_boss_alert(event, count)

    def _trigger_boss_alert(self, event: SecurityEvent, count: int) -> None:
        """
        Non-blocking boss alert.
        Fires WhatsApp / WebSocket notification via background task.
        """
        logger.critical(
            f" [ShadowBoss ALERT] Threshold breached! "
            f"event_type={event.event_type} | user={event.user_id} | "
            f"count={count}/{_ALERT_THRESHOLDS.get(event.event_type)} in {_ALERT_WINDOW_SECONDS}s | "
            f"business={event.business_id}"
        )
        alert_payload = {
            "alert_type":  "security_threshold_breach",
            "event_type":  event.event_type,
            "severity":    event.severity,
            "user_id":     event.user_id,
            "business_id": event.business_id,
            "employee_id": event.employee_id,
            "count":       count,
            "window_sec":  _ALERT_WINDOW_SECONDS,
            "timestamp":   event.timestamp.isoformat(),
        }
        self._fire_background_alert(alert_payload)

    #  Query API  used by Shadow Boss dashboard / analytics 

    def get_recent_events(
        self,
        limit:       int           = 50,
        event_type:  Optional[str] = None,
        severity:    Optional[str] = None,
        user_id:     Optional[str] = None,
        business_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Query the in-memory ring buffer with optional filters.
        Returns list of event dicts, most recent first.
        """
        results = list(reversed(self._events))   # newest first

        if event_type:
            results = [e for e in results if e.event_type == event_type]
        if severity:
            results = [e for e in results if e.severity == severity]
        if user_id:
            results = [e for e in results if e.user_id == user_id]
        if business_id:
            results = [e for e in results if e.business_id == business_id]

        return [e.to_dict() for e in results[:limit]]

    def get_threat_summary(self, business_id: str = "") -> Dict[str, Any]:
        """
        Returns a structured threat summary for a business.
        Used by Shadow Boss panel and Boss dashboard.
        """
        events = [e for e in self._events if not business_id or e.business_id == business_id]

        by_type:     Dict[str, int] = defaultdict(int)
        by_severity: Dict[str, int] = defaultdict(int)
        alerted:     int            = 0

        for e in events:
            by_type[e.event_type]     += 1
            by_severity[e.severity]   += 1
            if e.alerted:
                alerted += 1

        most_recent = events[-1].to_dict() if events else None

        return {
            "total_events":    len(events),
            "alerted_events":  alerted,
            "by_type":         dict(by_type),
            "by_severity":     dict(by_severity),
            "most_recent":     most_recent,
            "buffer_capacity": _RING_BUFFER_SIZE,
            "business_id":     business_id or "all",
        }

    def get_user_threat_score(self, user_id: str) -> Dict[str, Any]:
        """
        Returns a threat profile for a specific user.
        Useful for Gatekeeper to auto-blacklist repeat offenders.
        """
        user_events  = [e for e in self._events if e.user_id == user_id]
        event_counts = defaultdict(int)
        for e in user_events:
            event_counts[e.event_type] += 1

        # Score: weighted by severity
        _weights = {"CRITICAL": 10, "HIGH": 5, "MEDIUM": 2, "LOW": 1}
        raw_score = sum(
            _weights.get(_SEVERITY.get(et, "LOW"), 1) * count
            for et, count in event_counts.items()
        )

        threat_level = (
            "CRITICAL" if raw_score >= 20 else
            "HIGH"     if raw_score >= 10 else
            "MEDIUM"   if raw_score >= 5  else
            "LOW"
        )

        return {
            "user_id":      user_id,
            "total_events": len(user_events),
            "event_counts": dict(event_counts),
            "raw_score":    raw_score,
            "threat_level": threat_level,
        }

    #  WebSocket Push Registration 

    def register_ws_callback(self, callback) -> None:
        """
        Register an async callback to push events to Boss dashboard in real-time.
        Called by the WebSocket route handler at startup.

        Signature: async def callback(event_dict: dict) -> None
        """
        self._ws_callbacks.append(callback)
        logger.debug(f" [ShadowBossMonitor] WebSocket callback registered ({len(self._ws_callbacks)} total).")

    #  Logging 

    @staticmethod
    def _log_event(event: SecurityEvent) -> None:
        """Structured log with severity-appropriate level."""
        msg = (
            f" [SecurityEvent] {event.severity} | {event.event_type} | "
            f"user={event.user_id} | role={event.role} | action={event.action} | "
            f"emp={event.employee_id} | biz={event.business_id}"
        )
        if event.severity == "CRITICAL":
            logger.critical(msg)
        elif event.severity == "HIGH":
            logger.warning(msg)
        elif event.severity == "MEDIUM":
            logger.info(msg)
        else:
            logger.debug(msg)

    #  Background async tasks 

    def _fire_background(self, event: SecurityEvent) -> None:
        """
        Schedule async MongoDB + Redis + WebSocket push as background tasks.
        Completely non-blocking  hot path is not affected.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self._persist_to_mongo(event))
                loop.create_task(self._push_to_redis(event))
                if self._ws_callbacks:
                    loop.create_task(self._push_to_websockets(event))
        except RuntimeError:
            # No running event loop (test environments)  skip async tasks
            pass

    def _fire_background_alert(self, alert_payload: Dict[str, Any]) -> None:
        """Fire boss alert notification in background."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self._send_boss_alert(alert_payload))
        except RuntimeError:
            pass

    async def _persist_to_mongo(self, event: SecurityEvent) -> None:
        """Persist event to MongoDB security_events collection."""
        try:
            if self._mongo_db is None:
                from motor.motor_asyncio import AsyncIOMotorClient
                mongo_uri  = os.getenv("MONGO_URI", "mongodb://localhost:27017/cluaiz")
                client     = AsyncIOMotorClient(mongo_uri)
                self._mongo_db = client.get_default_database()

            await self._mongo_db[_MONGO_COLLECTION].insert_one(event.to_dict())
            logger.debug(f" [ShadowBossMonitor] Event {event.event_id} persisted to MongoDB.")
        except Exception as e:
            # Never crash the hot path due to storage failure
            logger.error(f" [ShadowBossMonitor] MongoDB persist failed: {e}")

    async def _push_to_redis(self, event: SecurityEvent) -> None:
        """
        Publish event to Redis pub/sub channel for real-time dashboard.
        Channel: cluaiz:security_events:{business_id}
        """
        try:
            if self._redis is None:
                import redis.asyncio as aioredis
                redis_url    = os.getenv("REDIS_URL", "redis://localhost:6379")
                self._redis  = aioredis.from_url(redis_url, decode_responses=True)

            import json
            channel = f"cluaiz:security_events:{event.business_id or 'global'}"
            await self._redis.publish(channel, json.dumps(event.to_dict()))
        except Exception as e:
            logger.debug(f" [ShadowBossMonitor] Redis push failed (non-critical): {e}")

    async def _push_to_websockets(self, event: SecurityEvent) -> None:
        """Push event to all registered WebSocket callbacks."""
        event_dict = event.to_dict()
        for cb in list(self._ws_callbacks):
            try:
                await cb(event_dict)
            except Exception as e:
                logger.warning(f" [ShadowBossMonitor] WebSocket push failed: {e}")
                self._ws_callbacks.remove(cb)

    async def _send_boss_alert(self, alert_payload: Dict[str, Any]) -> None:
        """
        Send Boss alert via available channels.
        Priority: WebSocket (real-time)  WhatsApp (if configured)  Email

        WhatsApp integration: uses existing WA service if WHATSAPP_BOSS_NUMBER is set.
        """
        # 1. WebSocket push (always attempted first)
        for cb in list(self._ws_callbacks):
            try:
                await cb({"type": "boss_alert", **alert_payload})
            except Exception:
                pass

        # 2. WhatsApp alert (if Boss WA number configured)
        boss_wa_number = os.getenv("BOSS_WA_NUMBER", "")
        if boss_wa_number:
            try:
                msg = (
                    f" *Cluaiz Security Alert*\n"
                    f"Event: {alert_payload['event_type']}\n"
                    f"Severity: {alert_payload['severity']}\n"
                    f"User: {alert_payload['user_id']}\n"
                    f"Count: {alert_payload['count']} in {alert_payload['window_sec']}s\n"
                    f"Employee: {alert_payload.get('employee_id', 'N/A')}\n"
                    f"Time: {alert_payload['timestamp']}"
                )
                # Lazy import  avoids circular dependency
                from src.services.messaging.whatsapp_service import send_whatsapp_message
                await send_whatsapp_message(to=boss_wa_number, message=msg)
                logger.info(f" [ShadowBossMonitor] Boss WA alert sent to {boss_wa_number}.")
            except Exception as e:
                logger.warning(f" [ShadowBossMonitor] WA alert failed: {e}")

    #  Health check 

    def health(self) -> Dict[str, Any]:
        """Returns monitor health status for system dashboard."""
        return {
            "status":           "ok",
            "events_in_buffer": len(self._events),
            "buffer_capacity":  _RING_BUFFER_SIZE,
            "ws_callbacks":     len(self._ws_callbacks),
            "redis_connected":  self._redis is not None,
            "mongo_connected":  self._mongo_db is not None,
        }


#  Module-level singleton 

# This is the ONE instance imported by all security contracts:
#   from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
shadow_boss_monitor = ShadowBossMonitor()
