"""
 SKILL 13: PAGE NAVIGATOR  The UI Teleporter
================================================
Alex (IT Commander) ka primary weapon.
Ye MongoDB me saved crawler ui_elements dhundh ke
frontend widget ko navigate/click/search JSON emit karta hai.
"""

import os
import re
from typing import Dict, Any, Optional, List, Type
from pydantic import BaseModel, Field
from loguru import logger
from src.services.aiskills.engine.base_skill import SemanticContract
from src.services.aiskills.types import ContextPackage, EscalationTrigger


#  Input Schema 

class PageNavigatorInput(BaseModel):
    """
    What Alex needs to perform a UI action.
    action_type: 'navigate' | 'click' | 'search_site' | 'scan_page'
    target: URL path, element text/ID, or search query
    """
    action_type: str = Field(
        ...,
        description="The UI action to perform: 'navigate', 'click', 'search_site', or 'scan_page'."
    )
    target: str = Field(
        ...,
        description="The URL path for navigate, element text/aria-label/id for click, or query for search_site."
    )
    org_id: Optional[str] = Field(
        default=None,
        description="The org ID to look up stored ui_elements from the crawler database."
    )
    target_type: Optional[str] = Field(
        default=None,
        description="For click: 'aria-label', 'id', or 'text'. Auto-detected if not provided."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Extra context: method (spa_push/hard_reload), wait, reason, etc."
    )


#  The Skill Contract 

class PageNavigatorContract(SemanticContract):
    """
     Skill 13: The UI Teleporter, Action Executor & Live Search Engine.
    Alex uses this to literally drive the user's website like a human.
    """

    @property
    def capability_statement(self) -> str:
        return (
            "I can navigate the user to any page on their website, "
            "click any button or link by name or ID, "
            "perform a search using the website's native search engine, "
            "or scan the current page for live real-time information. "
            "Trigger me when user says: 'open page', 'go to', 'click', 'navigate', "
            "'show me', 'search for', 'find on site', 'where is', 'take me to'."
        )

    @property
    def input_schema(self) -> Type[BaseModel]:
        return PageNavigatorInput

    async def _run(
        self,
        params: PageNavigatorInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generates a structured ui_action JSON.
        Alex doesn't execute JS  he generates the command.
        The frontend cluaiz widget intercepts and runs it.
        """

        action = params.action_type.strip().lower()

        #  1. NAVIGATE 
        if action == "navigate":
            # Try to find the path in MongoDB crawler data first
            resolved_path = await self._resolve_path(params.target, params.org_id)
            method = params.metadata.get("method", "spa_push")

            logger.info(f" [PageNavigator] NAVIGATE  {resolved_path} (method: {method})")
            return {
                "ui_action": {
                    "action": "navigate",
                    "data": {
                        "path": resolved_path,
                        "method": method
                    }
                },
                "thought": f"Navigating user to '{resolved_path}' as requested."
            }

        #  2. CLICK 
        elif action == "click":
            #  STEP 1: Try to resolve element from MongoDB crawler data
            resolved_el = await self._resolve_element(params.target, params.org_id)

            # Determine final targeting strategy
            if resolved_el:
                target_type = resolved_el.get("target_type", "id")
                target_value = resolved_el.get("target_value", params.target)
                logger.info(f" [PageNavigator] CLICK  DB-resolved '{target_value}' ({target_type}) for query '{params.target}'")
            else:
                # Fallback: Auto-detect from what user gave
                target_type = params.target_type
                target_value = params.target
                if not target_type:
                    if " " in params.target:
                        target_type = "text"
                    elif params.target.startswith("#"):
                        target_type = "id"
                        target_value = params.target.lstrip("#")
                    else:
                        target_type = "id"
                logger.info(f" [PageNavigator] CLICK  Fallback targeting '{target_value}' ({target_type})")
            return {
                "ui_action": {
                    "action": "click",
                    "data": {
                        "targetType": target_type,
                        "targetValue": target_value,
                        "waitToBeClickable": params.metadata.get("wait", True),
                        "dbResolved": resolved_el is not None  #  Frontend can trust this more
                    }
                },
                "thought": f"Clicking on '{target_value}' ({target_type}) to perform the action."
            }

        #  3. SEARCH SITE 
        elif action == "search_site":
            logger.info(f" [PageNavigator] SEARCH SITE  '{params.target}'")
            return {
                "ui_action": {
                    "action": "search_site",
                    "data": {
                        "searchQuery": params.target
                    }
                },
                "thought": f"Searching website for '{params.target}' using native search."
            }

        #  4. SCAN PAGE 
        elif action == "scan_page":
            logger.info(f" [PageNavigator] SCAN PAGE  gathering live context")
            return {
                "ui_action": {
                    "action": "scan_page",
                    "data": {
                        "reason": params.metadata.get("reason", "Gathering live context for accurate answer")
                    }
                },
                "thought": "Initiating millisecond DOM scan to get current page data."
            }

        #  UNKNOWN 
        else:
            return {
                "status": "error",
                "message": f"Unknown action type: '{action}'. Use: navigate, click, search_site, scan_page."
            }

    #  Helper: Resolve URL Path from MongoDB Site ui_elements 

    async def _resolve_path(self, target: str, org_id: Optional[str]) -> str:
        """
        Try to find the URL path in crawled Site.pages.
        Falls back to the target string itself if not found.
        """
        if not org_id:
            return target

        try:
            import motor.motor_asyncio
            from src.core.config import settings

            client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
            db = client[settings.MONGODB_DB_NAME]

            # Search crawled pages for matching URL or title
            target_lower = target.lower()

            # Search by page URL or title containing target keyword
            sites = await db["sites"].find(
                {"orgId": org_id},
                {"pages": 1}
            ).to_list(length=20)

            best_match = None
            best_score = 0

            for site in sites:
                for page in site.get("pages", []):
                    page_url = page.get("url", "")
                    page_title = page.get("title", "").lower()
                    page_path = page_url.split("//")[-1].split("/", 1)[-1] if "//" in page_url else page_url

                    # Score match
                    score = 0
                    if target_lower in page_url.lower():
                        score += 3
                    if target_lower in page_title:
                        score += 2
                    if any(word in page_url.lower() for word in target_lower.split()):
                        score += 1

                    if score > best_score:
                        best_score = score
                        # Extract just the path from full URL
                        try:
                            from urllib.parse import urlparse
                            parsed = urlparse(page_url)
                            best_match = parsed.path or page_url
                        except:
                            best_match = page_url

            if best_match and best_score > 0:
                logger.info(f" [PageNavigator] Resolved '{target}'  '{best_match}' (score: {best_score})")
                return best_match
            else:
                # Direct use  maybe boss already gave exact path
                return f"/{target.lstrip('/')}"

        except Exception as e:
            logger.warning(f" [PageNavigator] Path resolution failed: {e}. Using target directly.")
            return target

    #  Helper: Resolve Element Selector from MongoDB ui_elements 

    async def _resolve_element(
        self,
        query: str,
        org_id: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """
         The UI Teleporter Core (Skill 13):
        Searches MongoDB's crawler-extracted ui_elements for the best
        matching aria_label or id for the given natural language query.

        Priority (per doc): aria-label > id > text
        Returns targeting info for the JS Widget, or None (triggers text-fallback).
        """
        if not org_id:
            return None

        try:
            import motor.motor_asyncio
            from src.core.config import settings

            client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
            db = client[settings.MONGODB_DB_NAME]

            query_lower = query.lower()

            # Only search sites where user has opted into UI Actions
            sites = await db["sites"].find(
                {"orgId": org_id, "allowUI_Actions": True},
                {"pages.ui_elements": 1, "pages.url": 1}
            ).to_list(length=10)

            best: Optional[Dict] = None
            best_score = 0

            for site in sites:
                for page in site.get("pages", []):
                    for el in page.get("ui_elements", []):
                        score = 0

                        aria  = (el.get("aria_label") or "").lower()
                        text  = (el.get("text")       or "").lower()
                        el_id = (el.get("id")         or "").lower()

                        # Score: exact > partial
                        if query_lower == aria:   score += 10
                        elif query_lower in aria: score += 6
                        if query_lower == text:   score += 8
                        elif query_lower in text: score += 4
                        if query_lower == el_id:  score += 5
                        elif query_lower in el_id:score += 3

                        if score > best_score:
                            best_score = score
                            # Priority 1: aria-label (most stable)
                            if el.get("aria_label"):
                                best = {
                                    "target_type": "aria-label",
                                    "target_value": el["aria_label"],
                                    "score": score,
                                    "page_url": page.get("url")
                                }
                            # Priority 2: id
                            elif el.get("id"):
                                best = {
                                    "target_type": "id",
                                    "target_value": el["id"],
                                    "score": score,
                                    "page_url": page.get("url")
                                }
                            # Priority 3: innerText fallback
                            elif el.get("text"):
                                best = {
                                    "target_type": "text",
                                    "target_value": el["text"],
                                    "score": score,
                                    "page_url": page.get("url")
                                }

            if best and best_score >= 3:
                logger.info(
                    f" [PageNavigator] Element resolved: '{query}'  "
                    f"{best['target_type']}='{best['target_value']}' (score: {best['score']})"
                )
                return best
            else:
                logger.info(f" [PageNavigator] No DB match for '{query}'. Widget will use fuzzy-text fallback.")
                return None

        except Exception as e:
            logger.warning(f" [PageNavigator] Element resolution failed: {e}")
            return None
