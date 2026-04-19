from playwright.sync_api import sync_playwright
from src.utils.logger import logger
from bs4 import BeautifulSoup
import asyncio
import requests
from urllib.parse import urljoin, urlparse
import uuid
from typing import List, Dict, Any

class CrawlService:
    def __init__(self):
        self.storage_client = None 
        self.bad_extensions = {
            '.mp4', '.mp3', '.wav', '.mov', '.avi', '.wmv', '.m4a',
            '.zip', '.tar', '.gz', '.7z', '.rar', 
            '.exe', '.dmg', '.pkg', '.bin', '.iso',
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'
        }

    def _is_crawlable(self, url: str) -> bool:
        """
        Quick check to skip obviously non-text media files.
        """
        parsed = urlparse(url.lower())
        path = parsed.path
        if any(path.endswith(ext) for ext in self.bad_extensions):
            return False
        return True

    async def crawl_url(self, url: str, allow_ui_actions: bool = False):
        """
        Advanced Crawler for Dynamic Sites (SPA/React).
        Uses SYNC Playwright in a Thread to bypass Windows Proactor/Selector Loop issues.
        """
        logger.info(f" Starting Crawl for: {url} | UI Actions: {allow_ui_actions}")
        return await asyncio.to_thread(self._crawl_sync, url, allow_ui_actions)

    async def discover_links(self, url: str):
        """
        Fast Static Discovery (Replicates Legacy Cheerio/Axios logic).
        Uses requests + BeautifulSoup. No Browser Overhead.
        """
        return await asyncio.to_thread(self._discover_links_sync, url)

    def _discover_links_sync(self, url: str):
        try:
            logger.info(f" Discovery: Starting for {url}")
            links = set()
            title = "Untitled"
            parsed_base = urlparse(url)
            base_domain = parsed_base.netloc
            scheme = parsed_base.scheme or "https"
            
            # --- STRATEGY 1: CHECK SITEMAP.XML ---
            sitemap_url = f"{scheme}://{base_domain}/sitemap.xml"
            try:
                logger.info(f" Checking Sitemap: {sitemap_url}")
                sm_res = requests.get(sitemap_url, timeout=5)
                if sm_res.status_code == 200:
                    soup_sm = BeautifulSoup(sm_res.content, "xml") # Try XML
                    if not soup_sm.find("urlset"): # Fallback to html parser if xml fails
                         soup_sm = BeautifulSoup(sm_res.content, "html.parser")
                    
                    locs = soup_sm.find_all("loc")
                    if locs:
                        for loc in locs:
                            l = loc.text.strip()
                            if base_domain in l:
                                links.add(l)
                        logger.info(f" Sitemap found {len(links)} links")
            except Exception as sm_err:
                logger.warning(f" Sitemap check failed: {sm_err}")

            # If Sitemap gave good results (e.g. > 5), we can return mixed or just sitemap
            # But usually we want deeper nav links too. Let's combine strategies.

            # --- STRATEGY 2: STATIC HTML SCRAPE (Requests) ---
            if len(links) < 5:
                try:
                    headers = {'User-Agent': 'Mozilla/5.0 (compatible; CluaizBot/1.0)'}
                    res = requests.get(url, headers=headers, timeout=10)
                    res.raise_for_status()
                    
                    soup = BeautifulSoup(res.text, "html.parser")
                    title = soup.title.string.strip() if soup.title and soup.title.string else title
                    
                    for a in soup.find_all("a", href=True):
                        href = a.get('href')
                        if not href: continue
                        full_url = urljoin(url, href)
                        if urlparse(full_url).netloc == base_domain and self._is_crawlable(full_url):
                            links.add(full_url.split('#')[0].rstrip('/'))
                except Exception as req_err:
                     logger.warning(f" Static scrape failed: {req_err}")

            # --- STRATEGY 3: SPA FALLBACK (Playwright) ---
            # If we still have very few links (indicating JS Rendering), use Browser
            if len(links) < 3:
                logger.info(" Low link count. Attempting SPA Discovery via Browser...")
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()
                    try:
                        page.goto(url, timeout=30000, wait_until="domcontentloaded")
                        # Wait a bit for Hydration
                        page.wait_for_timeout(2000)
                        
                        title = page.title()
                        
                        # Get all anchors
                        hrefs = page.eval_on_selector_all("a", "elements => elements.map(el => el.href)")
                        for href in hrefs:
                            if base_domain in href:
                                links.add(href.split('#')[0].rstrip('/'))
                                
                    except Exception as pw_err:
                         logger.error(f" Browser Discovery Failed: {pw_err}")
                    finally:
                        browser.close()

            # Final Cleanup
            valid_links = [l for l in list(links) if l.startswith("http")]
            
            logger.info(f" Final Discovery: {len(valid_links)} links on {url}")
            
            return {
                "url": url,
                "title": title,
                "links": valid_links[:100], # Limit to 100
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f" Discovery Implementation Error: {str(e)}")
            # Return "success" with empty list instead of failing entire request (avoids 500 error)
            return {"url": url, "title": "Discovery Error", "links": [], "status": "success", "warning": str(e)}

    def _crawl_sync(self, url: str, allow_ui_actions: bool = False):
        """
        Synchronous Implementation running in a separate thread.
        """
        try:
            with sync_playwright() as p:
                # Launch in Stealth Mode (Headless)
                browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-gpu"])
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                )
                page = context.new_page()

                # 0. Pre-check: Is this even crawlable? (Media Filter)
                if not self._is_crawlable(url):
                    logger.warning(f" [Crawler] Skipping non-web media URL: {url}")
                    browser.close()
                    return {"url": url, "status": "skipped", "reason": "media_filter"}

                # 1. Navigate & Wait for Network Idle (Crucial for SPAs like Netlify)
                logger.info(f" Navigating to {url}...")
                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                except Exception as goto_err:
                    if "Download is starting" in str(goto_err):
                        logger.warning(f" [Crawler] Skipping '{url}' because it's a direct download (PDF/Doc).")
                        browser.close()
                        return {"url": url, "status": "skipped", "reason": "download", "content": f"Download source: {url}"}
                    raise goto_err
                
                # 2. Extract Content after hydration
                content = page.content()
                
                # 3. Clean HTML using BeautifulSoup
                soup = BeautifulSoup(content, "html.parser")

                #  SKILL 13: Extract UI elements BEFORE removing nav/footer
                # (buttons in nav like "Login", "Settings" are important for navigation)
                ui_elements = []
                if allow_ui_actions:
                    ui_elements = self._extract_ui_elements(soup, url)
                    logger.info(f" [Skill 13] Extracted {len(ui_elements)} UI elements from {url}")
                else:
                    logger.info(f" [Skill 13] Skipping UI element extraction (Opt-out)")
                
                # Remove junk for TEXT extraction only
                for script in soup(["script", "style", "iframe"]):
                    script.extract()

                # Extract Title & Text using Markdownify
                title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled"
                import markdownify
                text = markdownify.markdownify(str(soup), heading_style="ATX").strip()
                
                # 4. Take Visual Snapshot (Screenshot)
                screenshot_bytes = page.screenshot(full_page=False) # Viewport only to save size/time
                
                # 5. Extract Links (for Discovery)
                links = set()
                # Clean base domain validation
                safe_base = url.split("://")[-1].split("/")[0].replace(":", "_")
                if not safe_base: safe_base = "unknown_domain"

                # Upload Screenshot
                screenshot_url = None
                if self.storage_client:
                    screenshot_key = f"crawls/{safe_base}/snapshots/{uuid.uuid4()}.png"
                    screenshot_url = self.storage_client.upload_content(screenshot_bytes, screenshot_key, content_type="image/png")

                # Upload HTML (as before)
                raw_url = None
                if self.storage_client:
                    file_key = f"crawls/{safe_base}/{uuid.uuid4()}.html"
                    raw_url = self.storage_client.upload_content(content, file_key)

                base_domain = "/".join(url.split("/")[:3]) # Simple domain extraction http://site.com

                for a_tag in soup.find_all("a", href=True):
                    href = a_tag.get("href")
                    if not href: continue
                    full_url = href
                    
                    # Handle relative URLs
                    if href.startswith("/"):
                        full_url = f"{base_domain}{href}"
                    elif not href.startswith("http"):
                        continue # Skip javascript: mailto: etc
                    
                    # Filter Internal & Valid
                    if base_domain in full_url:
                        links.add(full_url.split("#")[0].rstrip("/"))

                browser.close()

                logger.info(f" Crawled {len(text)} chars from {url} | Found {len(links)} internal links |  Saved HTML to: {raw_url} |  Screenshot to: {screenshot_url}")
                
                # VALIDATION: Ensure we got meaningful content
                if len(text) < 100:
                    raise Exception(f"Content too short ({len(text)} chars). Possible block or empty page.")
                
                #  EXACT TOKEN COUNTING (TikToken)
                try:
                    import tiktoken
                    enc = tiktoken.get_encoding("cl100k_base") # OpenAI Standard
                    token_count = len(enc.encode(text))
                except Exception as tk_err:
                    logger.warning(f" TikToken failed, falling back to approximation: {tk_err}")
                    token_count = len(text) // 4
                
                return {
                    "url": url,
                    "title": title,
                    "content": text,
                    "token_count": token_count, #  EXACT TOKENS
                    "media": [], 
                    "links": list(links),
                    "ui_elements": ui_elements,  #  SKILL 13: Page UI map
                    "raw_storage_url": raw_url, # Deep Research Reference
                    "status": "success"
                }

        except Exception as e:
            logger.error(f" Playwright Crawl Failed: {str(e)}")
            # Don't fallback to static - fail fast so worker can handle it properly
            raise

    def _crawl_static_sync(self, url: str, allow_ui_actions: bool = False):
        """
        Fallback Static Crawler using requests + BeautifulSoup.
        Used when Playwright is missing or fails.
        """
        try:
            logger.info(f" Starting Static Crawl (Fallback) for: {url}")
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; CluaizBot/1.0)'}
            res = requests.get(url, headers=headers, timeout=15)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.text, "html.parser")
            
            #  SKILL 13: Extract UI elements BEFORE removing nav
            ui_elements = self._extract_ui_elements(soup, url) if allow_ui_actions else []

            # Remove junk for TEXT only
            for script in soup(["script", "style", "iframe"]):
                script.extract()
            
            # Extract Title & Text using Markdownify
            title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled"
            import markdownify
            text = markdownify.markdownify(str(soup), heading_style="ATX").strip()
            
            # Extract Links
            links = set()
            parsed_base = urlparse(url)
            base_domain = parsed_base.netloc
            
            for a in soup.find_all("a", href=True):
                href = a.get('href')
                if not href: continue
                full_url = urljoin(url, href)
                if urlparse(full_url).netloc == base_domain:
                    clean_url = full_url.split('#')[0].rstrip('/')
                    links.add(clean_url)

            logger.info(f" Static Crawl Success: {len(text)} chars | {len(links)} links | {len(ui_elements)} UI elements")
            
            return {
                "url": url,
                "title": title,
                "content": text,
                "media": [],
                "links": list(links),
                "ui_elements": ui_elements,  #  SKILL 13
                "status": "success"
            }
        except Exception as e:
             logger.error(f" Static Crawl Failed: {str(e)}")
             return {"url": url, "status": "failed", "error": str(e), "ui_elements": []}

    def _extract_ui_elements(self, soup: BeautifulSoup, page_url: str) -> List[Dict[str, Any]]:
        """
         SKILL 13: Extract all interactive UI elements from a page.
        Runs during the SAME crawl pass  zero extra network requests.
        Extracts: id, aria-label, button text, link text, href.
        """
        elements = []
        seen = set()  # Dedup tracker

        # --- 1. Buttons ---
        for el in soup.find_all(["button", "input", "a"]):
            entry = {}

            # Get ID
            el_id = el.get("id", "").strip()
            if el_id:
                entry["id"] = el_id

            # Get aria-label (highest priority for clicking)
            aria = el.get("aria-label", "").strip()
            if aria:
                entry["aria_label"] = aria

            # Get visible text
            text = el.get_text(strip=True)[:80]  # Limit length
            if text and text not in (".", ",", ""):
                entry["text"] = text

            # Get href for links
            href = el.get("href", "")
            if href and not href.startswith(("javascript:", "mailto:", "tel:", "#")):
                entry["href"] = href

            # Get element type
            entry["tag"] = el.name
            entry["page_url"] = page_url

            # Only add if we have something meaningful to target
            if entry.get("id") or entry.get("aria_label") or entry.get("text"):
                # Dedup key
                key = f"{entry.get('id','')}-{entry.get('aria_label','')}-{entry.get('text','')[:30]}"
                if key not in seen:
                    seen.add(key)
                    elements.append(entry)

        # --- 2. Sections with IDs (for scroll-to) ---
        for el in soup.find_all(["section", "div", "main", "article"], id=True):
            el_id = el.get("id", "").strip()
            if el_id and el_id not in seen:
                # Get heading inside section
                heading = el.find(["h1", "h2", "h3"])
                heading_text = heading.get_text(strip=True)[:60] if heading else ""
                elements.append({
                    "tag": el.name,
                    "id": el_id,
                    "text": heading_text,
                    "page_url": page_url,
                    "type": "section"
                })
                seen.add(el_id)

        return elements[:200]  # Cap at 200 per page

    async def research_url(self, url: str, query: str = "") -> dict:
        """
         RESEARCH MODE (NEW  Crawl4AI powered)
        
        Extracts clean, token-efficient content from a URL for LLM consumption.
        Uses Crawl4AI's BM25 'fit_markdown' algorithm to reduce 50,000+ token
        raw HTML pages down to ~300-500 tokens of relevant content.
        
        DIFFERENT from crawl_url():
         - crawl_url()     Playwright, full HTML, MCP navigation, UI elements
         - research_url()  Crawl4AI, fit_markdown, research content, LLM-ready
        
        Args:
            url:   URL to fetch content from
            query: Optional query hint for BM25 relevance scoring
        
        Returns:
            {"url", "title", "content", "tokens_approx", "method"}
        """
        from src.services.aiskills.research.crawl4ai_reader import crawl4ai_reader
        return await crawl4ai_reader.read(url, query)


crawl_service = CrawlService()
