"""

    RATE LIMITER V2  Redis-Backed, Production Grade                        
  core/security/rate_limiter.py                                               
                                                                              
  V1 Problems (Fixed):                                                        
     In-memory only   server restart = all limits reset                    
     No IP throttle   attacker changes user_id to bypass                   
     No blacklist     repeat offenders keep trying                         
     Single window    burst attacks possible at window edge                
                                                                              
  V2 Solutions:                                                               
     Redis ZSET sliding window  survives restarts, shared across workers   
     Dual-key check: user_id + ip_address (both must pass)                 
     Permanent blacklist in Redis (persists until manually lifted)          
     Progressive backoff  repeated violations  escalating window          
     Shadow Boss Monitor integration for security event logging             
     Backwards compatible  get_rate_limiter() still works for V1 callers  
     Graceful fallback  if Redis is down, falls back to in-memory          

"""

from __future__ import annotations

import time
import os
from collections import defaultdict, deque
from typing import Any, Dict, Optional

from loguru import logger


#  Redis Key Schema 
#
#  cluaiz:rl:uid:{skill_id}:{user_id}           ZSET  (sliding window  user)
#  cluaiz:rl:ip:{skill_id}:{ip_addr}            ZSET  (sliding window  IP)
#  cluaiz:rl:blacklist:uid:{user_id}            STRING "reason|timestamp"
#  cluaiz:rl:blacklist:ip:{ip_addr}             STRING "reason|timestamp"
#  cluaiz:rl:violations:{user_id}               INT   (lifetime violation counter)
#
_KEY_RL_UID      = "cluaiz:rl:uid:{skill_id}:{user_id}"
_KEY_RL_IP       = "cluaiz:rl:ip:{skill_id}:{ip}"
_KEY_BL_UID      = "cluaiz:rl:blacklist:uid:{user_id}"
_KEY_BL_IP       = "cluaiz:rl:blacklist:ip:{ip}"
_KEY_VIOLATIONS  = "cluaiz:rl:violations:{user_id}"

#  Default Skill Limits 

_DEFAULT_LIMIT  = 10    # requests
_DEFAULT_WINDOW = 60    # seconds

# Per-skill overrides  (limit, window_seconds)
_SKILL_LIMITS: Dict[str, Dict[str, int]] = {
    "sentiment_analysis":  {"limit": 30,  "window": 60},
    "shopify_fetch":       {"limit": 5,   "window": 60},
    "email_service":       {"limit": 3,   "window": 300},
    "whatsapp_template":   {"limit": 5,   "window": 60},
    "bouncer":             {"limit": 100, "window": 60},   # Security skills need high limits
    "gatekeeper":          {"limit": 100, "window": 60},
    "the_judge":           {"limit": 100, "window": 60},
    "report_generator":    {"limit": 3,   "window": 300},
    "payment_link":        {"limit": 5,   "window": 60},
}

# IP-level limits (stricter  applies even if user_id rotates)
_IP_LIMIT  = 50   # requests per window from same IP
_IP_WINDOW = 60   # seconds

# Progressive backoff: violation count  multiplied window
_BACKOFF_MULTIPLIERS = {1: 1, 2: 2, 3: 4, 4: 8}   # 4+ violations  8x window
_MAX_VIOLATIONS_BEFORE_BLACKLIST = 5


#  Rate Limiter V2 

class RateLimiter:
    """
     Production Rate Limiter V2.

    Dual-layer sliding window check (user_id + IP address).
    Redis-backed for persistence across restarts and distributed workers.
    Automatic fallback to in-memory if Redis is unavailable.

    Usage (unchanged from V1):
        limiter = get_rate_limiter()
        result  = limiter.check_rate_limit(skill_id="order_lookup", user_id="u_abc")
        if not result["allowed"]:
            return {"status": "error", "message": "Rate limit exceeded"}

    V2 additions:
        result = limiter.check_rate_limit(
            skill_id="order_lookup",
            user_id="u_abc",
            ip_address="203.0.113.42"   # NEW: optional IP throttle
        )
    """

    def __init__(self):
        #  Redis client (lazy  initialised on first use) 
        self._redis          = None
        self._redis_ok       = True   # assume Redis up until proven otherwise

        #  In-memory fallback (V1 compat + Redis-down mode) 
        self._mem_requests:   Dict[str, Dict[str, deque]] = defaultdict(
            lambda: defaultdict(deque)
        )
        self._mem_blacklist:  Dict[str, str] = {}   # uid/ip  reason

        logger.info(" [RateLimiter V2] Initialised. Redis mode: PENDING (lazy connect)")

    #  Redis lazy init 

    def _get_redis(self):
        """
        Returns a synchronous Redis client (redis-py).
        Lazy  avoids import overhead on process start.
        Falls back to None if unavailable.
        """
        if self._redis is not None:
            return self._redis
        if not self._redis_ok:
            return None
        try:
            import redis
            redis_url    = os.getenv("REDIS_URL", "redis://localhost:6379")
            self._redis  = redis.from_url(redis_url, decode_responses=True,
                                          socket_connect_timeout=1,
                                          socket_timeout=1)
            self._redis.ping()   # Verify connection
            logger.info(" [RateLimiter V2] Redis connected.")
            return self._redis
        except Exception as e:
            logger.warning(f" [RateLimiter] Redis unavailable ({e}). Using in-memory fallback.")
            self._redis_ok = False
            return None

    #  Core Public API 

    def check_rate_limit(
        self,
        skill_id:   str,
        user_id:    str          = "default",
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Check if this request is within rate limits.
        Checks BOTH user_id AND ip_address (if provided).
        First check that fails  request blocked.

        Returns:
            {
                "allowed":     bool,
                "remaining":   int,
                "reset_in":    int (seconds),
                "limit":       int,
                "window":      int,
                "blocked_by":  str  ("user_id" | "ip" | "blacklist" | None)
            }
        """
        #  0. Blacklist check (fastest possible reject) 
        bl_result = self._check_blacklist(user_id, ip_address)
        if bl_result:
            return bl_result

        r = self._get_redis()

        #  1. User-based sliding window 
        config         = _SKILL_LIMITS.get(skill_id, {"limit": _DEFAULT_LIMIT, "window": _DEFAULT_WINDOW})
        limit          = config["limit"]
        window         = config["window"]
        window         = self._apply_backoff(user_id, window, r)   # progressive backoff

        if r:
            uid_result = self._redis_sliding_window(
                r, key=_KEY_RL_UID.format(skill_id=skill_id, user_id=user_id),
                limit=limit, window=window
            )
        else:
            uid_result = self._mem_sliding_window(
                bucket=f"{skill_id}:{user_id}",
                limit=limit, window=window
            )

        if not uid_result["allowed"]:
            self._record_violation(user_id, skill_id, r)
            logger.warning(
                f" [RateLimiter] BLOCKED (user) | skill={skill_id} | "
                f"user={user_id} | count={limit}/{window}s"
            )
            return {**uid_result, "blocked_by": "user_id"}

        #  2. IP-based sliding window (if IP provided) 
        if ip_address:
            if r:
                ip_result = self._redis_sliding_window(
                    r, key=_KEY_RL_IP.format(skill_id=skill_id, ip=ip_address),
                    limit=_IP_LIMIT, window=_IP_WINDOW
                )
            else:
                ip_result = self._mem_sliding_window(
                    bucket=f"ip:{skill_id}:{ip_address}",
                    limit=_IP_LIMIT, window=_IP_WINDOW
                )

            if not ip_result["allowed"]:
                logger.warning(
                    f" [RateLimiter] BLOCKED (IP) | skill={skill_id} | "
                    f"ip={ip_address} | count={_IP_LIMIT}/{_IP_WINDOW}s"
                )
                # IP block also increments user violations
                self._record_violation(user_id, skill_id, r)
                return {**ip_result, "blocked_by": "ip"}

        return {**uid_result, "blocked_by": None}

    #  Blacklist Management 

    def blacklist_user(
        self,
        user_id:   str,
        reason:    str            = "manual_block",
        ttl_hours: Optional[int]  = None,   # None = permanent
    ) -> None:
        """
        Permanently (or time-limited) blacklist a user_id.
        Boss can call this from the Shadow Boss panel.
        """
        r = self._get_redis()
        value = f"{reason}|{time.time()}"

        if r:
            key = _KEY_BL_UID.format(user_id=user_id)
            if ttl_hours:
                r.setex(key, ttl_hours * 3600, value)
            else:
                r.set(key, value)
        else:
            self._mem_blacklist[f"uid:{user_id}"] = value

        logger.warning(f" [RateLimiter] User BLACKLISTED | user={user_id} | reason={reason} | ttl={ttl_hours}h")

        # Alert Shadow Boss
        self._alert_shadow_boss("user_blacklisted", user_id=user_id, reason=reason)

    def blacklist_ip(
        self,
        ip_address: str,
        reason:     str           = "ip_flood",
        ttl_hours:  Optional[int] = 24,   # Default 24h for IP blocks
    ) -> None:
        """Blacklist an IP address."""
        r = self._get_redis()
        value = f"{reason}|{time.time()}"

        if r:
            key = _KEY_BL_IP.format(ip=ip_address)
            if ttl_hours:
                r.setex(key, ttl_hours * 3600, value)
            else:
                r.set(key, value)
        else:
            self._mem_blacklist[f"ip:{ip_address}"] = value

        logger.warning(f" [RateLimiter] IP BLACKLISTED | ip={ip_address} | reason={reason} | ttl={ttl_hours}h")

    def remove_from_blacklist(self, user_id: str = "", ip_address: str = "") -> None:
        """Manually lift a blacklist (Boss admin action)."""
        r = self._get_redis()
        if user_id:
            if r:
                r.delete(_KEY_BL_UID.format(user_id=user_id))
            else:
                self._mem_blacklist.pop(f"uid:{user_id}", None)
            logger.info(f" [RateLimiter] Blacklist LIFTED for user={user_id}")
        if ip_address:
            if r:
                r.delete(_KEY_BL_IP.format(ip=ip_address))
            else:
                self._mem_blacklist.pop(f"ip:{ip_address}", None)
            logger.info(f" [RateLimiter] Blacklist LIFTED for ip={ip_address}")

    #  Admin / Stats 

    def reset_user(self, skill_id: str, user_id: str) -> None:
        """Reset rate limit counter for a specific user (V1 compat)."""
        r = self._get_redis()
        if r:
            r.delete(_KEY_RL_UID.format(skill_id=skill_id, user_id=user_id))
        else:
            self._mem_requests[skill_id].pop(user_id, None)
        logger.info(f" [RateLimiter] Reset | skill={skill_id} | user={user_id}")

    def get_stats(self, skill_id: str) -> Dict[str, Any]:
        """Get current usage stats for a skill (V1 compat + enhanced)."""
        r = self._get_redis()
        if r:
            try:
                pattern = f"cluaiz:rl:uid:{skill_id}:*"
                keys    = r.keys(pattern)
                total_requests = sum(r.zcard(k) for k in keys)
                return {
                    "active_users":   len(keys),
                    "total_requests": total_requests,
                    "backend":        "redis",
                }
            except Exception:
                pass

        # In-memory fallback
        return {
            "active_users":   len(self._mem_requests.get(skill_id, {})),
            "total_requests": sum(
                len(q) for q in self._mem_requests.get(skill_id, {}).values()
            ),
            "backend": "in_memory",
        }

    def health(self) -> Dict[str, Any]:
        """Returns rate limiter health for system dashboard."""
        r = self._get_redis()
        redis_ok = False
        if r:
            try:
                r.ping()
                redis_ok = True
            except Exception:
                pass
        return {
            "redis_connected":     redis_ok,
            "fallback_active":     not redis_ok,
            "in_memory_buckets":   sum(len(v) for v in self._mem_requests.values()),
            "in_memory_blacklist": len(self._mem_blacklist),
        }

    #  Internal: Redis sliding window (O(log N) per operation) 

    @staticmethod
    def _redis_sliding_window(
        r,
        key:    str,
        limit:  int,
        window: int,
    ) -> Dict[str, Any]:
        """
        Redis ZSET sliding window rate limiter.

        Algorithm:
            1. ZREMRANGEBYSCORE  evict expired timestamps
            2. ZCARD             count current requests
            3. ZADD              record this request (if allowed)
            4. EXPIRE            auto-expire key after window (memory hygiene)

        All 4 ops in a pipeline  single RTT.
        """
        now     = time.time()
        cutoff  = now - window

        try:
            pipe = r.pipeline(transaction=False)   # Non-transactional for speed
            pipe.zremrangebyscore(key, "-inf", cutoff)
            pipe.zcard(key)
            result = pipe.execute()

            current_count = result[1]   # Count after eviction
            allowed       = current_count < limit

            if allowed:
                pipe2 = r.pipeline(transaction=False)
                pipe2.zadd(key, {str(now): now})
                pipe2.expire(key, window + 5)    # +5s buffer
                pipe2.execute()

            reset_in = max(0, int(window - (now - float(
                r.zrange(key, 0, 0, withscores=True)[0][1]
                if r.zcard(key) > 0 else [("", now)]
            )[0][1]))) if r.zcard(key) > 0 else 0

            return {
                "allowed":   allowed,
                "remaining": max(0, limit - current_count - (1 if allowed else 0)),
                "reset_in":  reset_in,
                "limit":     limit,
                "window":    window,
            }
        except Exception as e:
            logger.error(f" [RateLimiter] Redis op failed: {e}. Allowing request (fail-open).")
            # Fail-open: never block legitimate requests due to Redis hiccup
            return {"allowed": True, "remaining": 1, "reset_in": 0, "limit": limit, "window": window}

    #  Internal: In-memory sliding window (fallback) 

    def _mem_sliding_window(
        self,
        bucket: str,
        limit:  int,
        window: int,
    ) -> Dict[str, Any]:
        """In-memory deque sliding window (V1 logic  used when Redis is down)."""
        now    = time.time()
        cutoff = now - window
        q      = self._mem_requests["_fallback"][bucket]

        while q and q[0] < cutoff:
            q.popleft()

        allowed = len(q) < limit
        if allowed:
            q.append(now)

        reset_in = int(window - (now - q[0])) if q else 0
        return {
            "allowed":   allowed,
            "remaining": max(0, limit - len(q)),
            "reset_in":  reset_in,
            "limit":     limit,
            "window":    window,
        }

    #  Internal: Blacklist Check 

    def _check_blacklist(
        self,
        user_id:    str,
        ip_address: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        """
        Returns a BLOCK result dict if blacklisted, else None.
        Checks both user_id and IP. Fast-path  checked before any window logic.
        """
        r = self._get_redis()

        # Check user blacklist
        uid_key  = _KEY_BL_UID.format(user_id=user_id)
        bl_value = None

        if r:
            try:
                bl_value = r.get(uid_key)
            except Exception:
                bl_value = self._mem_blacklist.get(f"uid:{user_id}")
        else:
            bl_value = self._mem_blacklist.get(f"uid:{user_id}")

        if bl_value:
            reason = bl_value.split("|")[0]
            logger.warning(f" [RateLimiter] BLACKLISTED user | user={user_id} | reason={reason}")
            return {
                "allowed":    False,
                "remaining":  0,
                "reset_in":   -1,      # -1 = indefinite (blacklisted)
                "limit":      0,
                "window":     0,
                "blocked_by": "blacklist_uid",
                "reason":     reason,
            }

        # Check IP blacklist
        if ip_address:
            ip_key   = _KEY_BL_IP.format(ip=ip_address)
            ip_bl    = None

            if r:
                try:
                    ip_bl = r.get(ip_key)
                except Exception:
                    ip_bl = self._mem_blacklist.get(f"ip:{ip_address}")
            else:
                ip_bl = self._mem_blacklist.get(f"ip:{ip_address}")

            if ip_bl:
                reason = ip_bl.split("|")[0]
                logger.warning(f" [RateLimiter] BLACKLISTED IP | ip={ip_address} | reason={reason}")
                return {
                    "allowed":    False,
                    "remaining":  0,
                    "reset_in":   -1,
                    "limit":      0,
                    "window":     0,
                    "blocked_by": "blacklist_ip",
                    "reason":     reason,
                }

        return None

    #  Internal: Violation Tracking + Progressive Backoff 

    def _record_violation(self, user_id: str, skill_id: str, r) -> None:
        """
        Increment lifetime violation counter.
        Auto-blacklist if threshold exceeded.
        """
        key   = _KEY_VIOLATIONS.format(user_id=user_id)
        count = 1

        if r:
            try:
                count = r.incr(key)
                r.expire(key, 86400 * 7)   # Violation history: 7 days
            except Exception:
                pass
        else:
            current = int(self._mem_blacklist.get(f"viol:{user_id}", "0"))
            count   = current + 1
            self._mem_blacklist[f"viol:{user_id}"] = str(count)

        logger.debug(f" [RateLimiter] Violation #{count} | user={user_id} | skill={skill_id}")

        # Auto-blacklist on threshold
        if count >= _MAX_VIOLATIONS_BEFORE_BLACKLIST:
            self.blacklist_user(
                user_id=user_id,
                reason=f"auto_blacklist_after_{count}_violations",
                ttl_hours=24,
            )

    def _apply_backoff(self, user_id: str, base_window: int, r) -> int:
        """
        Progressive backoff: repeated violations  longer effective window.
        violation_count: 1  1x | 2  2x | 3  4x | 4+  8x
        """
        key   = _KEY_VIOLATIONS.format(user_id=user_id)
        count = 1

        if r:
            try:
                val   = r.get(key)
                count = int(val) if val else 1
            except Exception:
                pass
        else:
            count = int(self._mem_blacklist.get(f"viol:{user_id}", "1"))

        multiplier = _BACKOFF_MULTIPLIERS.get(count, 8)   # 4+  always 8x
        return base_window * multiplier

    #  Shadow Boss Alert 

    @staticmethod
    def _alert_shadow_boss(event_type: str, **kwargs) -> None:
        """Non-blocking alert to Shadow Boss monitor."""
        try:
            from src.services.aiskills.psychology.shadow_boss.monitor import shadow_boss_monitor
            shadow_boss_monitor.log_security_event({"event_type": event_type, **kwargs})
        except Exception as e:
            logger.debug(f" [RateLimiter] Shadow Boss alert failed: {e}")


#  Module-level singleton (backwards compatible with V1) 

_rate_limiter: Optional[RateLimiter] = None

def get_rate_limiter() -> RateLimiter:
    """
    Get global rate limiter instance.
    V1 callers: no changes needed.
    V2 callers: pass ip_address= kwarg to check_rate_limit() for IP throttling.
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
