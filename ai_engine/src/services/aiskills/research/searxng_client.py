"""

   SearxNG Client  Unlimited Free Search API            
  Cluaiz Neural OS | research/searxng_client.py            
                                                           
  Role: Self-hosted metasearch (Google/Bing/Reddit/70+)    
  Cost: FREE & UNLIMITED (self-hosted Docker)              
  Tokens: ~10 per result (JSON snippet only)               

"""
import os
import asyncio
import aiohttp
from typing import List, Dict
from loguru import logger


#  Config 
SEARXNG_BASE_URL = os.getenv("SEARXNG_URL", "http://localhost:8082")
DEFAULT_ENGINES  = "google,bing,reddit,wikipedia"
DEFAULT_RESULTS  = 5


class SearxNGClient:
    """
    Lightweight async wrapper for self-hosted SearxNG JSON API.
    
    Setup:
        docker run -p 8080:8080 searxng/searxng
        In settings.yml  formats: [json]   (enable JSON output)
    """

    def __init__(self, base_url: str = SEARXNG_BASE_URL):
        self.base_url = base_url.rstrip("/")

    async def search(
        self,
        query: str,
        num_results: int = DEFAULT_RESULTS,
        engines: str = DEFAULT_ENGINES,
        language: str = "en"
    ) -> List[Dict[str, str]]:
        """
        Search SearxNG and return a list of clean result dicts.
        
        Returns:
            [{"title": "...", "url": "...", "snippet": "..."}]
        """
        params = {
            "q":        query,
            "format":   "json",
            "engines":  engines,
            "language": language,
        }

        try:
            logger.info(f"[SearxNG] Searching: '{query}' | engines={engines}")
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/search",
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"[SearxNG] Non-200 status: {resp.status}")
                        return []

                    data = await resp.json()

            results = data.get("results", [])
            cleaned = [
                {
                    "title":   r.get("title", "")[:120],
                    "url":     r.get("url", ""),
                    "snippet": r.get("content", "")[:300],   # ~75 tokens max
                }
                for r in results[:num_results]
                if r.get("url")
            ]

            logger.success(f"[SearxNG] Found {len(cleaned)} results for: '{query}'")
            return cleaned

        except aiohttp.ClientConnectorError:
            logger.error(
                "[SearxNG] Connection refused. Is SearxNG running? "
                "Run: docker run -p 8080:8080 searxng/searxng"
            )
            return []
        except Exception as e:
            logger.error(f"[SearxNG] Search failed: {e}")
            return []

    async def health_check(self) -> bool:
        """Returns True if SearxNG is reachable."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.base_url, timeout=aiohttp.ClientTimeout(total=3)
                ) as resp:
                    return resp.status < 400
        except Exception:
            return False


# Singleton
searxng_client = SearxNGClient()
