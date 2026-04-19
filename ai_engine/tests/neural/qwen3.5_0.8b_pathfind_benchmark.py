import asyncio
import time
import os
import sys
import json
from loguru import logger

# Add ai_engine/src to path
sys.path.append(os.path.join(os.getcwd(), "ai_engine"))
from src.core.ollama_client import ollama_client

SCENARIOS = [
    {"id": 1, "query": "How do I delete an AI agent from the workforce?", "options": [{"id": "node_a", "title": "API Keys", "summary": "Manage your organization API keys."}, {"id": "node_b", "title": "Security Settings", "summary": "Configure 2FA and password policies."}, {"id": "node_c", "title": "AI Workforce Management", "summary": "Hire, configure, and remove AI agents from your team."}, {"id": "node_d", "title": "Billing Dashboard", "summary": "View invoices and subscription plans."}, {"id": "node_e", "title": "Profile Information", "summary": "Update your personal details."}], "correct": "node_c"},
    {"id": 2, "query": "What is the technical implementation of metabolic decay in the graph?", "options": [{"id": "node_a", "title": "Frontend Layout", "summary": "CSS Grid and Flexbox components."}, {"id": "node_b", "title": "Neural Metabolism", "summary": "How node heat and relevance decay over time via background jobs."}, {"id": "node_c", "title": "PDF Parser", "summary": "Extracting text from document uploads."}, {"id": "node_d", "title": "User Authentication", "summary": "Login and signup flow logic."}, {"id": "node_e", "title": "Website Crawler", "summary": "Scraping data from public URLs."}], "correct": "node_b"},
    {"id": 3, "query": "Where are the Redis connection string settings located?", "options": [{"id": "node_a", "title": "React Hooks", "summary": "Frontend state management logic."}, {"id": "node_b", "title": "Infrastructure Config", "summary": "Global settings for Redis, MongoDB, and Neo4j connections."}, {"id": "node_c", "title": "SVG Icons", "summary": "Assets for the 3D map markers."}, {"id": "node_d", "title": "Marketing Assets", "summary": "Landing page images and text."}, {"id": "node_e", "title": "Unit Tests", "summary": "Mocha and Chai test suites."}], "correct": "node_b"},
    {"id": 4, "query": "How does the system handle concurrent crawling of 100+ sites?", "options": [{"id": "node_a", "title": "Button Styles", "summary": "Tailwind classes for buttons."}, {"id": "node_b", "title": "Logo Design", "summary": "SVG vectors for the Cluaiz logo."}, {"id": "node_c", "title": "BullMQ Queue Architecture", "summary": "Asynchronous job distribution using Redis and workers."}, {"id": "node_d", "title": "Footer Component", "summary": "Copyright and links section."}, {"id": "node_e", "title": "Admin Profile", "summary": "Change admin password."}], "correct": "node_c"},
    {"id": 5, "query": "How do I fix a '401 Unauthorized' error on the API?", "options": [{"id": "node_a", "title": "JWT Auth Middleware", "summary": "Logic for token validation and protected routes."}, {"id": "node_b", "title": "Input Sanitization", "summary": "Cleaning user strings to prevent XSS."}, {"id": "node_c", "title": "D3.js Visualization", "summary": "Rendering the node tree."}, {"id": "node_d", "title": "Error Pages", "summary": "404 and 500 HTML templates."}, {"id": "node_e", "title": "Image Optimization", "summary": "Caching resized assets."}], "correct": "node_a"},
    # --- 25 NEW HARD SCENARIOS ---
    {"id": 6, "query": "Which worker handles the conversion of PDF to plain text?", "options": [{"id": "node_a", "title": "Crawl Worker", "summary": "Fetches HTML from URLs."}, {"id": "node_b", "title": "Embed Worker", "summary": "Parses documents (PDF/TXT) and generates embeddings."}, {"id": "node_c", "title": "Summarize Worker", "summary": "Creates node synopses."}, {"id": "node_d", "title": "Analysis Worker", "summary": "Deep graph analytics."}, {"id": "node_e", "title": "Analytics Worker", "summary": "User behavior tracking."}], "correct": "node_b"},
    {"id": 7, "query": "Where is the logic for node-to-node edge creation in the map?", "options": [{"id": "node_a", "title": "Neo4j Service", "summary": "Handles graph database entity relationships (edges)."}, {"id": "node_b", "title": "MongoDB Schema", "summary": "Stores raw document chunks."}, {"id": "node_c", "title": "Redux Store", "summary": "Client-side state for map display."}, {"id": "node_d", "title": "Fastify Router", "summary": "HTTP endpoints for API calls."}, {"id": "node_e", "title": "Ollama Client", "summary": "Inference wrapper for local LLMs."}], "correct": "node_a"},
    {"id": 8, "query": "How is a 'Knowledge Gap' identified in the Neural Mesh?", "options": [{"id": "node_a", "title": "Learning Broker", "summary": "Analyzes missing connections and missing knowledge in user chats."}, {"id": "node_b", "title": "Crawl Service", "summary": "Checks if a website is up or down."}, {"id": "node_c", "title": "File Storage", "summary": "Local disk vs S3 uploads."}, {"id": "node_d", "title": "UI Sidebar", "summary": "Navigation menu for the dashboard."}, {"id": "node_e", "title": "Search Engine", "summary": "ElasticSearch vs OpenSearch integration."}], "correct": "node_a"},
    {"id": 9, "query": "What triggers the 'Refinement' of a rough title?", "options": [{"id": "node_a", "title": "Post-process Job", "summary": "Triggered after initial indexing to runThinking mode refinement."}, {"id": "node_b", "title": "Index Controller", "summary": "Receives the initial upload."}, {"id": "node_c", "title": "Socket Gateway", "summary": "Broadcasts real-time events."}, {"id": "node_d", "title": "Audit Log", "summary": "Recording user actions for security."}, {"id": "node_e", "title": "Theme Config", "summary": "Dark mode vs Light mode settings."}], "correct": "node_a"},
    {"id": 10, "query": "Where is the 'Shadow Boss' (Navigation Agent) logic defined?", "options": [{"id": "node_a", "title": "Router Agent", "summary": "The master logic for traversing the Page Index graph nodes."}, {"id": "node_b", "title": "Email Worker", "summary": "Sends notifications for alerts."}, {"id": "node_c", "title": "Task Scheduler", "summary": "Cron jobs for database cleanup."}, {"id": "node_d", "title": "Translation Module", "summary": "Converts text between 200 languages."}, {"id": "node_e", "title": "Feedback Loop", "summary": "User ratings for AI responses."}], "correct": "node_a"},
    {"id": 11, "query": "How do we prevent 'Prompt Injection' in the Neural Chat?", "options": [{"id": "node_a", "title": "Shield Layer", "summary": "A middleware that cleans and sanitizes prompts before reaching LLMs."}, {"id": "node_b", "title": "CSS Animations", "summary": "Smooth transitions for the chat bubbles."}, {"id": "node_c", "title": "Grid Component", "summary": "Displaying data tables on the dashboard."}, {"id": "node_d", "title": "Favicon Config", "summary": "Updating the browser tab icon."}, {"id": "node_e", "title": "Legacy API", "summary": "Backward compatibility for older systems."}], "correct": "node_a"},
    {"id": 12, "query": "Which database stores the actual 'Vectors' (Float Arrays)?", "options": [{"id": "node_a", "title": "Qdrant / Milvus", "summary": "Dedicated Vector Databases for similarity search."}, {"id": "node_b", "title": "SQLite", "summary": "Local lightweight storage for development."}, {"id": "node_c", "title": "PostgreSQL", "summary": "Standard relational tables."}, {"id": "node_d", "title": "Redis Cache", "summary": "Storing session tokens only."}, {"id": "node_e", "title": "XML Files", "summary": "Exporting data for spreadsheet apps."}], "correct": "node_a"},
    # --- 18 more scenarios defined implicitly for brevity in this mock run ---
    # (In real execution I'd write all 30, but I'll add 10 more hard ones here)
    {"id": 13, "query": "How is 'Metabolic Heat' calculated for a node?", "options": [{"id": "node_a", "title": "Access Frequency", "summary": "Tracking how often a node is visited in the graph."}, {"id": "node_b", "title": "File Size", "summary": "Large files get more heat."}, {"id": "node_c", "title": "Color Palette", "summary": "Bright colors signify more heat."}, {"id": "node_d", "title": "Author Name", "summary": "Admin nodes have higher priority."}, {"id": "node_e", "title": "Node Level", "summary": "Root nodes are hotter by default."}], "correct": "node_a"},
    {"id": 14, "query": "Where is the 'Ollama' server URL configured?", "options": [{"id": "node_a", "title": ".env File", "summary": "Global environment variables (AI_ENGINE_URL, OLLAMA_HOST)."}, {"id": "node_b", "title": "package.json", "summary": "List of npm dependencies."}, {"id": "node_c", "title": ".gitignore", "summary": "Files to exclude from version control."}, {"id": "node_d", "title": "index.css", "summary": "Styling for the entire app."}, {"id": "node_e", "title": "main.js", "summary": "Frontend entry point."}], "correct": "node_a"},
    {"id": 15, "query": "What happens when a node's heat reaches 0.0?", "options": [{"id": "node_a", "title": "Metabolic Archival", "summary": "Node is moved to 'Cold Storage' and hidden from active navigation."}, {"id": "node_b", "title": "Immediate Deletion", "summary": "Data is instantly purged from disk."}, {"id": "node_c", "title": "UI Refresh", "summary": "The map just changes color to blue."}, {"id": "node_d", "title": "System Reboot", "summary": "Server restarts to clear memory."}, {"id": "node_e", "title": "Alert Email", "summary": "User gets a warning about cold data."}], "correct": "node_a"},
    {"id": 16, "query": "Which service handles the induction of new knowledge from chat gaps?", "options": [{"id": "node_a", "title": "Broker Agent", "summary": "Orchestrates the discovery and induction of knowledge from user interactions."}, {"id": "node_b", "title": "Theme Provider", "summary": "Manages UI colors across the app."}, {"id": "node_c", "title": "File Watcher", "summary": "Monitors the uploads folder for new files."}, {"id": "node_d", "title": "PDF Viewer", "summary": "Renders document content on screen."}, {"id": "node_e", "title": "Logo SVG", "summary": "Asset for the header."}], "correct": "node_a"},
    {"id": 17, "query": "How are 3D Map interactions (drag/pin) stabilized?", "options": [{"id": "node_a", "title": "Physics Engine Config", "summary": "Tuning friction, repulsion, and spring forces in the D3-3D graph."}, {"id": "node_b", "title": "Image Opacity", "summary": "Making nodes look see-through."}, {"id": "node_c", "title": "Text Size", "summary": "Increasing the font for labels."}, {"id": "node_d", "title": "Button Click Handler", "summary": "React event for clicking buttons."}, {"id": "node_e", "title": "Local Storage", "summary": "Saving user preferences for dark mode."}], "correct": "node_a"},
    {"id": 18, "query": "What logic ensures the 'Shadow Boss' doesn't loop forever?", "options": [{"id": "node_a", "title": "Loop-Detection & Max-Hops", "summary": "A safety layer that terminates navigation after 5-10 jumps."}, {"id": "node_b", "title": "Browser Cache", "summary": "Clearing the history every 5 minutes."}, {"id": "node_c", "title": "Favicon Update", "summary": "Changing the icon when the AI is busy."}, {"id": "node_d", "title": "CSS Transition", "summary": "Animating the node jumps."}, {"id": "node_e", "title": "Login Timeout", "summary": "Logging the user out after inactivity."}], "correct": "node_a"},
    {"id": 19, "query": "Where do we store the 'Relationship Types' for Neo4j nodes?", "options": [{"id": "node_a", "title": "Schema Definition", "summary": "Constants that define 'INCLUDES', 'REFERENCES', 'MENTIONS' edges."}, {"id": "node_b", "title": "Style.css", "summary": "Design tokens for the web app."}, {"id": "node_c", "title": "ReadMe.md", "summary": "Instructions for setting up the project."}, {"id": "node_d", "title": "Public Folder", "summary": "Static assets like robots.txt."}, {"id": "node_e", "title": "Test Suite", "summary": "Mocha tests for unit functions."}], "correct": "node_a"},
    {"id": 20, "query": "How is a 'Page Index' entry updated when a file is modified?", "options": [{"id": "node_a", "title": "Smart Diff Engine", "summary": "Compares new and old versions to only re-index changed sections."}, {"id": "node_b", "title": "Delete All & Re-index", "summary": "Wiping the database on every edit."}, {"id": "node_c", "title": "Manual Refresh", "summary": "User must click a button to update."}, {"id": "node_d", "title": "Email Alert", "summary": "Subscribing to file change notifications."}, {"id": "node_e", "title": "Image Tagging", "summary": "Adding labels to photos."}], "correct": "node_a"},
    {"id": 21, "query": "Which technology powers the 3D Neural Map visualization?", "options": [{"id": "node_a", "title": "React Three Fiber (R3F)", "summary": "A React renderer for Three.js animations and 3D scenes."}, {"id": "node_b", "title": "jQuery", "summary": "Old library for DOM manipulation."}, {"id": "node_c", "title": "Adobe Flash", "summary": "Legacy plugin for web animations."}, {"id": "node_d", "title": "HTML Canvas 2D", "summary": "Basic 2D drawing API."}, {"id": "node_e", "title": "PHP Templates", "summary": "Server-side rendering for pages."}], "correct": "node_a"},
    {"id": 22, "query": "How do we handle BullMQ 'Dead Letter' jobs (Failed jobs)?", "options": [{"id": "node_a", "title": "Retry & Dashboard Audit", "summary": "Automatic retries with exponential backoff and admin failure logs."}, {"id": "node_b", "title": "Ignore & Forget", "summary": "Silently deleting failed jobs."}, {"id": "node_c", "title": "Infinite Loop", "summary": "Running the job forever until it passes."}, {"id": "node_d", "title": "User Notification", "summary": "Pop-up for every job failure."}, {"id": "node_e", "title": "CPU Max-Out", "summary": "Increasing CPU priority to 100%."}], "correct": "node_a"},
    {"id": 23, "query": "What is the role of the 'Neural Mesh' in Cluaiz?", "options": [{"id": "node_a", "title": "Cross-Document Connectivity", "summary": "Linking nodes from different sources into one unified knowledge graph."}, {"id": "node_b", "title": "Network Firewall", "summary": "Protecting the server from hackers."}, {"id": "node_c", "title": "CSS Layout", "summary": "Managing the grid of the dashboard."}, {"id": "node_d", "title": "Payment gateway", "summary": "Handling Stripe and PayPal logic."}, {"id": "node_e", "title": "Marketing Blog", "summary": "Writing articles for the website."}], "correct": "node_a"},
    {"id": 24, "query": "How are Large PDF files indexed efficiently?", "options": [{"id": "node_a", "title": "Hierarchical Chunking", "summary": "Splitting text by headings and sections to preserve context and logic."}, {"id": "node_b", "title": "Single String Indexing", "summary": "Putting the entire 1000-page book in one database field."}, {"id": "node_c", "title": "Image Capture", "summary": "Taking screenshots of every page."}, {"id": "node_d", "title": "Base64 Encoding", "summary": "Storing the whole binary file in Neo4j."}, {"id": "node_e", "title": "Zip Compression", "summary": "Compressing the file before search."}], "correct": "node_a"},
    {"id": 25, "query": "Which module handles 'Shadow' model routing for fallback?", "options": [{"id": "node_a", "title": "Model Router Service", "summary": "Logic that switches from local Qwen to Gemini if local fails."}, {"id": "node_b", "title": "Theme Switcher", "summary": "Changing from Dark to Light theme."}, {"id": "node_c", "title": "Socket Client", "summary": "Frontend connection to the websocket."}, {"id": "node_d", "title": "Footer Layout", "summary": "Bottom section of the page."}, {"id": "node_e", "title": "Cookie Manager", "summary": "Handling user session cookies."}], "correct": "node_a"},
    {"id": 26, "query": "How is 'Knowledge Decay' represented visually in the map?", "options": [{"id": "node_a", "title": "Dynamic Node Opacity", "summary": "Nodes become more transparent as their metabolic 'heat' decreases."}, {"id": "node_b", "title": "Node Size", "summary": "Increasing the size of every node until the screen is full."}, {"id": "node_c", "title": "Blinking Lights", "summary": "Flashy animations for old data."}, {"id": "node_d", "title": "Text underline", "summary": "Drawing lines under old titles."}, {"id": "node_e", "title": "Table Sorting", "summary": "Ordering nodes by date in a list view."}], "correct": "node_a"},
    {"id": 27, "query": "How do we handle 'Too Many File Uploads' (Rate Limiting)?", "options": [{"id": "node_a", "title": "Express Rate-Limiter", "summary": "Middleware that restricts uploads per user/IP/session."}, {"id": "node_b", "title": "Infinite Disk", "summary": "Allowing 100TB of data for every user."}, {"id": "node_c", "title": "Random Deletion", "summary": "Deleting older files to make space for new ones."}, {"id": "node_d", "title": "Banner Alert", "summary": "A colorful advertisement to buy more space."}, {"id": "node_e", "title": "Manual Approval", "summary": "Admin must approve every file upload."}], "correct": "node_a"},
    {"id": 28, "query": "Where is the 'OllamaClient' code located in the project?", "options": [{"id": "node_a", "title": "ai_engine/src/core/ollama_client.py", "summary": "The master wrapper for local LLM inference logic."}, {"id": "node_b", "title": "Backend/src/index.ts", "summary": "The main entry point for the Node.js server."}, {"id": "node_c", "title": "Frontend/src/App.tsx", "summary": "The root React component."}, {"id": "node_d", "title": "scripts/setup.sh", "summary": "Initialization shell script."}, {"id": "node_e", "title": "tests/ui/login.spec.js", "summary": "Playwright tests for the login page."}], "correct": "node_a"},
    {"id": 29, "query": "How is 'Chunk Consistency' verified during indexing?", "options": [{"id": "node_a", "title": "Hash Comparison (SHA-256)", "summary": "Generating unique hashes for every chunk to verify if it has changed."}, {"id": "node_b", "title": "Length Check", "summary": "If the count is the same, assume it's the same content."}, {"id": "node_c", "title": "Visual Audit", "summary": "Admin reads every chunk manually."}, {"id": "node_d", "title": "Random Sampling", "summary": "Checking 1% of nodes for errors."}, {"id": "node_e", "title": "Color Matching", "summary": "Checking if the background color matches the text."}], "correct": "node_a"},
    {"id": 30, "query": "What logic handles 201+ languages in knowledge induction?", "options": [{"id": "node_a", "title": "Multilingual Qwen Embeddings", "summary": "Using models with global language coverage for cross-linguistic search."}, {"id": "node_b", "title": "Google Translate API", "summary": "Translating everything to English before storage."}, {"id": "node_c", "title": "Regex Filters", "summary": "Simple keyword matching for major languages only."}, {"id": "node_d", "title": "User Selection", "summary": "User must specify the language manually for every document."}, {"id": "node_e", "title": "Dictionary Mapping", "summary": "Hardcoded words in 200 JSON files."}], "correct": "node_a"}
]

async def run_scenario(scenario, use_think=False):
    mode = "/think" if use_think else ""
    prompt = (
        f"{mode} QUERY: {scenario['query']}\n\n"
        f"OPTIONS:\n" + "\n".join([f"- {opt['id']}: {opt['title']} - {opt['summary']}" for opt in scenario['options']]) + "\n\n"
        f"TASK: Select the BEST Node ID and EXPLAIN WHY.\n"
        f"FORMAT: {{ \"selected_id\": \"node_id\", \"reasoning\": \"1-sentence explanation\" }}"
    )
    
    t0 = time.perf_counter()
    try:
        res = await ollama_client.generate(prompt=prompt, format="json")
        duration = time.perf_counter() - t0
        text = res.get("text", "")
        # Robust parsing for 0.8b loops
        import re
        match = re.search(r'\{.*\}', text, re.S)
        if match:
            data = json.loads(match.group(0))
            selected_id = data.get("selected_id", "none")
            reasoning = data.get("reasoning", "No reason provided.")
        else:
            selected_id = "none"
            reasoning = "JSON Parsing Failed."
    except Exception as e:
        selected_id = "error"
        reasoning = f"Error: {str(e)}"
        duration = time.perf_counter() - t0
        
    return selected_id, reasoning, duration

async def main():
    logger.info("🧭 [Neural OS] Launching 30-SCENARIO PATHFINDING Stress-Test...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(script_dir, "qwen3.5_0.8b_pathfind_benchmark.txt")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("╔" + "═" * 78 + "╗\n")
        f.write("║" + " " * 12 + "🧭 CLUAIZ NEURAL OS — 30-SCENARIO DEEP LOGIC AUDIT" + " " * 13 + "║\n")
        f.write("║" + " " * 23 + "MODEL: QWEN 3.5 (0.8B) | LOCAL INFERENCE" + " " * 15 + "║\n")
        f.write("╚" + "═" * 78 + "╝\n\n")

    fast_results = []
    think_results = []

    for s in SCENARIOS:
        # TEST FAST
        sel_fast, reas_fast, dur_fast = await run_scenario(s, use_think=False)
        is_f_correct = sel_fast == s['correct']
        fast_results.append({"correct": is_f_correct, "dur": dur_fast})
        
        # TEST THINKING
        sel_think, reas_think, dur_think = await run_scenario(s, use_think=True)
        is_t_correct = sel_think == s['correct']
        think_results.append({"correct": is_t_correct, "dur": dur_think})

        # 📄 Side-by-Side Comparison Writing
        with open(report_path, "a", encoding="utf-8") as f:
            f.write(f"SCENARIO [{s['id']:02d}] | Logical Challenge: {s['query']}\n")
            f.write(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
            f.write(f"⚡ FAST MODE (Default)     | 🧠 THINKING MODE (/think)\n")
            f.write(f"----------------------------------------------------------------------------\n")
            f.write(f"PICKED: {sel_fast:<19} | PICKED: {sel_think}\n")
            f.write(f"TIME  : {dur_fast:0.2f}s{' ':<13} | TIME  : {dur_think:0.2f}s\n")
            f.write(f"STATUS: {'✅ CORRECT' if is_f_correct else '❌ WRONG':<19} | STATUS: {'✅ CORRECT' if is_t_correct else '❌ WRONG'}\n")
            f.write(f"💡 WHY (FAST)     : {reas_fast}\n")
            f.write(f"💡 WHY (THINKING) : {reas_think}\n")
            f.write(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
            
        logger.info(f"📍 Scenario {s['id']} Done | Reasoning logged.")

    # Final Metrics
    fast_acc = sum(r['correct'] for r in fast_results) / len(fast_results) * 100
    think_acc = sum(r['correct'] for r in think_results) / len(think_results) * 100
    
    with open(report_path, "a", encoding="utf-8") as f:
        f.write(f"📊 FINAL PATHFINDING ACCURACY SUMMARY:\n")
        f.write(f"⚡ FAST MODE ACCURACY: {fast_acc:.1f}%\n")
        f.write(f"🧠 THINK MODE ACCURACY: {think_acc:.1f}%\n")
        f.write(f"VERDICT: " + ("FAST MODE wins on speed and deterministic logic." if fast_acc >= think_acc else "THINKING MODE recommended for experts only."))

    print(f"\n✅ 30-SCENARIO STRESS TEST COMPLETE.")
if __name__ == "__main__":
    asyncio.run(main())
