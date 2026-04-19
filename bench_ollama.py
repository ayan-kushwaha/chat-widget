import urllib.request
import json
import time
import sys

# 🔴 CONFIG: Ollama API
url = 'http://localhost:11434/api/chat'
model_name = 'qwen3:4b'
prompt = "Write a short story about a futuristic city in 100 words."

data = json.dumps({ 
    'model': model_name,
    'messages': [{'role': 'user', 'content': prompt}],
    'stream': True
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

# UI Style
CYAN = "\033[1;36m"
GRAY = "\033[90m"
WHITE = "\033[97m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
RESET = "\033[0m"
BOLD = "\033[1m"

print(f"\n{CYAN}┌────────────────────────────────────────────────────────┐")
print(f"│                {BOLD}🐳 OLLAMA BENCHMARK UI{RESET}{CYAN}                 │")
print(f"└────────────────────────────────────────────────────────┘{RESET}")
print(f"  {WHITE}Model: {model_name}{RESET}\n")

print(f"{YELLOW}🔍 Request Sent... Waiting for Ollama Kernels...{RESET}\n")

start = time.time()
first_token_time = None
word_count = 0
header_printed = False

try:
    with urllib.request.urlopen(req) as response:
        for line in response:
            if not line:
                continue
            
            try:
                chunk = json.loads(line.decode('utf-8'))
                
                # Ollama format:
                # {"model":"qwen3:4b","created_at":"...","message":{"role":"assistant","content":"tokens"},"done":false}
                content = chunk.get('message', {}).get('content', '')
                
                if not content:
                    continue

                # ── First token: record TTFT ──────────────
                if first_token_time is None:
                    first_token_time = time.time() - start
                    print(f"{GRAY}⏱️  TTFT: {first_token_time:.2f}s | Start Generating...{RESET}\n")
                    print(f"{CYAN}┃ {BOLD}RESPONSE:{RESET} ", end="", flush=True)
                    header_printed = True

                word_count += len(content.split())
                print(f"{WHITE}{content}", end="", flush=True)

            except Exception as e:
                # print(f"Error parsing chunk: {e}")
                continue

except KeyboardInterrupt:
    print(f"\n{YELLOW}🛑 Stopped by user.{RESET}")
except Exception as e:
    print(f"\n{YELLOW}❌ Error: {e}{RESET}")

end = time.time()
total_time = end - start

# Footer Stats
print(f"\n\n{CYAN}──────────────────────────────────────────────────────────")
print(f"{BOLD}📊 STATS:{RESET}")
print(f"  {WHITE}• Total Time  : {total_time:.2f}s")
if total_time > 0:
    # Approximate TPS (Tokens Per Second) - assuming 1.3 tokens per word
    print(f"  {WHITE}• Speed       : {CYAN}{BOLD}{(word_count * 1.3)/total_time:.2f} TPS{RESET}")
print(f"{CYAN}──────────────────────────────────────────────────────────{RESET}\n")
