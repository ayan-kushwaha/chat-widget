"""

   Browser-Use Reader  Human-like Anti-Bot Bypass         
  Cluaiz Neural OS | research/browser_use_reader.py          
                                                              
  Role: Access LinkedIn, Twitter, Instagram (anti-bot sites) 
  Method: Simulates real human browser clicks + scrolls      
  When: Only called when Crawl4AI detects anti-bot domain    

"""
from loguru import logger
from typing import Optional

# Detect if browser-use is installed
try:
    from browser_use import Agent as BrowserAgent
    from langchain_google_genai import ChatGoogleGenerativeAI
    BROWSER_USE_AVAILABLE = True
except ImportError:
    BROWSER_USE_AVAILABLE = False
    logger.warning(
        "[Browser-Use] Not installed. Run: pip install browser-use"
    )


class BrowserUseReader:
    """
    AI-powered browser agent for anti-bot websites.
    
    Uses the 'browser-use' library which runs a real Chromium and lets
    the AI click, scroll, and extract content just like a human.
    
    Only activated for domains: LinkedIn, Twitter, Instagram, Facebook.
    Falls back to a minimal response if not installed.
    """

    MAX_CHARS = 3000  # ~750 tokens

    async def read(self, url: str, query: str = "") -> dict:
        """
        Navigate to url as a human and extract relevant content.
        
        Returns:
            {"url": str, "title": str, "content": str, "tokens_approx": int, "method": str}
        """
        if not BROWSER_USE_AVAILABLE:
            logger.warning("[Browser-Use] Not available  returning placeholder")
            return {
                "url":           url,
                "title":         "Social Media (Unavailable)",
                "content":       (
                    f"Content from {url} could not be fetched. "
                    "Install browser-use: pip install browser-use"
                ),
                "tokens_approx": 20,
                "method":        "browser_use_unavailable"
            }

        try:
            import os
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GEMINI_API_KEY", "")
            )

            task = (
                f"Go to {url}. "
                f"Find content related to: '{query}'. "
                f"Extract the main text content (title, body paragraphs, key facts). "
                f"Return only the extracted text, no formatting."
            )

            agent = BrowserAgent(task=task, llm=llm)
            result = await agent.run()

            # Result comes back as string
            content = str(result)[: self.MAX_CHARS]

            logger.success(f"[Browser-Use] Successfully extracted {len(content)} chars from {url}")
            return {
                "url":           url,
                "title":         url.split("/")[2],   # domain as title
                "content":       content,
                "tokens_approx": len(content) // 4,
                "method":        "browser_use"
            }

        except Exception as e:
            logger.error(f"[Browser-Use] Failed for {url}: {e}")
            return {
                "url":           url,
                "title":         "Error",
                "content":       f"Browser-Use failed for {url}: {str(e)[:100]}",
                "tokens_approx": 15,
                "method":        "browser_use_error"
            }


# Singleton
browser_use_reader = BrowserUseReader()
