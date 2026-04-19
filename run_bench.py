import urllib.request
import json
import time
import sys

# 🔴 MASTER TOGGLE: True = Detailed Reasoning, False = Instant Direct Answer
THINK_MODE = False 
 
url = 'http://localhost:8085/v1/chat/completions'
prompt = "Write a short story about a futuristic city."

data = json.dumps({
    'model': 'qwen',
    'messages': [{'role': 'user', 'content': prompt}], 
    'max_tokens': 1024,
    'stream': True,
    'think': THINK_MODE
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
print(f"│                {BOLD}🚀 TURBO ENGINE PRO UI{RESET}{CYAN}                │")
print(f"└────────────────────────────────────────────────────────┘{RESET}")
print(f"  {WHITE}Mode: {'[REASONING ON]' if THINK_MODE else '[DIRECT FAST]'}{RESET}\n")

print(f"{YELLOW}🔍 Request Sent... Waiting for Turbo Kernels...{RESET}\n")

start = time.time()
first_token_time = None
word_count = 0
header_printed = False
is_thinking = THINK_MODE
buffer = ""

# Tags that may arrive split across chunks — wait for complete tag
PARTIAL_TAGS = ["<think>", "</think>", "<|im_"]

try:
    with urllib.request.urlopen(req) as response:
        for line in response:
            decoded_line = line.decode('utf-8').strip()
            if not decoded_line.startswith('data: ') or decoded_line == 'data: [DONE]':
                continue

            try:
                chunk = json.loads(decoded_line[6:])
                content = chunk['choices'][0]['delta'].get('content', '')
                if not content:
                    continue

                # ── First token: record TTFT + print section header ──────────────
                if first_token_time is None:
                    first_token_time = time.time() - start
                    print(f"{GRAY}⏱️  TTFT: {first_token_time:.2f}s | Start Generating...{RESET}\n")
                    if is_thinking:
                        print(f"{GRAY}┃ {BOLD}THINKING:{RESET}{GRAY} ", end="", flush=True)
                    else:
                        print(f"{CYAN}┃ {BOLD}RESPONSE:{RESET} ", end="", flush=True)
                    header_printed = True

                buffer += content

                # ── State-machine loop: process buffer until nothing left ─────────
                while True:
                    # ① </think> tag fully arrived → switch THINKING → RESPONSE
                    if "</think>" in buffer:
                        parts = buffer.split("</think>", 1)
                        think_chunk = parts[0].replace("<think>", "")
                        if think_chunk:
                            print(f"{GRAY}{think_chunk}{RESET}", end="", flush=True)
                        # Print transition separator + response header
                        print(f"\n{CYAN}┠" + "─" * 45 + f"{RESET}\n{CYAN}┃ {BOLD}RESPONSE:{RESET} ", end="", flush=True)
                        is_thinking = False
                        buffer = parts[1]   # ✅ continue with leftover after </think>
                        continue            # re-enter loop to process leftover

                    # ② <think> opening tag → strip it and keep going
                    if "<think>" in buffer:
                        buffer = buffer.replace("<think>", "")
                        continue

                    # ③ Partial tag at end of buffer → wait for next SSE chunk
                    #    (e.g. buffer ends with "</" or "<thi" — incomplete)
                    partial = False
                    for tag in PARTIAL_TAGS:
                        for i in range(1, len(tag)):
                            if buffer.endswith(tag[:i]):
                                partial = True
                                break
                        if partial:
                            break
                    if partial:
                        break   # ✅ break while-loop, wait for next chunk, DO NOT clear buffer

                    # ④ Buffer is clean — filter residual IM tokens & print
                    out = buffer.replace("<|im_start|>", "").replace("<|im_end|>", "")
                    if out:
                        word_count += len(out.split())
                        color = GRAY if is_thinking else WHITE
                        print(f"{color}{out}", end="", flush=True)
                    buffer = ""
                    break   # ✅ done with this chunk

            except Exception:
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
print(f"  {WHITE}• Speed       : {CYAN}{BOLD}{(word_count * 1.3)/total_time:.2f} TPS{RESET}")
print(f"{CYAN}──────────────────────────────────────────────────────────{RESET}\n")





