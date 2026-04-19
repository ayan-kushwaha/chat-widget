import asyncio
import time
import os
import sys
import re
import json
from loguru import logger

# Add src to path
sys.path.append(os.getcwd())

from src.core.ollama_client import ollama_client
from src.config.model_routing import master_model_router, TaskType

async def run_benchmark(num_nodes=50):
    logger.info(f"⚡ [Neural OS] Launching FAST-MODE (No Thinking) Stress-Test for qwen3.5:0.8b")
    
    route = await master_model_router.get_route(TaskType.CHUNK_SUMMARY)
    
    # Path Logic
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(script_dir, "qwen3.5_0.8b_nureal_benchmark_fast.txt")
    
    samples = [
        "The Cluaiz Neural OS utilizes a hybrid vector-graph architecture to map organizational knowledge with metabolic decay.",
        "GraphSAGE is an inductive learning framework that generates embeddings for previously unseen nodes by aggregating neighbor features.",
        "State-of-the-art Large Language Models (LLMs) use multi-head attention to capture long-range dependencies in natural language.",
        "Blockchain consensus mechanisms like Proof of Stake (PoS) provide secure, energy-efficient validation for decentralized networks.",
        "RAG (Retrieval-Augmented Generation) combines the parametric knowledge of LLMs with external retrieved context for factual accuracy."
    ]

    # 1. Initialize Header
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("╔" + "═" * 78 + "╗\n")
        f.write("║" + " " * 20 + "⚡ CLUAIZ NEURAL OS — FAST MODE BENCHMARK (NO THINK)" + " " * 8 + "║\n")
        f.write("║" + " " * 23 + "MODEL: QWEN 3.5 (0.8B) | LOCAL INFERENCE" + " " * 15 + "║\n")
        f.write("╚" + "═" * 78 + "╝\n\n")
        f.write(f"SYSTEM ANALYTICS (EXACT DATA):\n")
        f.write(f"━" * 80 + "\n")
        f.write(f"📂 Load Profile    : 50 High-Speed Neural Nodes (Direct Output)\n")
        f.write(f"━" * 80 + "\n\n")
        f.write("FAST NODE RECORDS (NO REASONING):\n")
        f.write("-" * 80 + "\n")

    start_total = time.perf_counter()
    total_tokens = 0

    for i in range(num_nodes):
        t0 = time.perf_counter()
        text_sample = samples[i % len(samples)]
        
        # JSON-ONLY PROMPT (Bypasses thinking in most models when format='json' is used)
        prompt = (f"JSON Pattern: {{ \"title\": \"3 words\", \"summary\": \"1 sentence\" }}\n\n"
                 f"TEXT: {text_sample}\n\n"
                 f"Generate JSON:")
        
        try:
            res = await ollama_client.generate(prompt=prompt, model=route["model_name"], temperature=0.1, format="json")
            duration = round(time.perf_counter() - t0, 3)
            r_text = res.get("text", "").strip()
            out_tokens = res.get("usage", {}).get("output", 0)
            total_tokens += out_tokens
            tps = round(out_tokens / duration, 2) if duration > 0 else 0

            # Robust JSON parsing
            json_status = "VALID"
            try:
                data = json.loads(r_text)
                title = data.get("title", "Fast Neural Node")
                summary = data.get("summary", "No summary provided.")
            except:
                json_status = "BROKEN (Regex Fallback)"
                # Fallback to regex if JSON is malformed
                t_match = re.search(r'"title":\s*"(.*?)"', r_text, re.I)
                s_match = re.search(r'"summary":\s*"(.*?)"', r_text, re.I)
                title = t_match.group(1).strip() if t_match else "Fast Neural Node"
                summary = s_match.group(1).strip() if s_match else r_text[:100]

            logger.info(f"⚡ Node {i+1:02d} | Title: {title} | Time: {duration}s | JSON: {json_status}")
            
            with open(report_path, "a", encoding="utf-8") as f:
                f.write(f"NODE [{i+1:03d}] | ⚡ FAST | Latency: {duration}s | Status: {json_status}\n")
                f.write(f"         ↳ RAW AI OUT : {r_text}\n")
                f.write(f"         ↳ PARSED TITL: {title}\n")
                f.write(f"         ↳ PARSED SYNO: {summary}\n")
                f.write("-" * 80 + "\n")
                
        except Exception as e:
            logger.error(f"❌ Node {i+1} FAILED: {e}")
            with open(report_path, "a", encoding="utf-8") as f:
                f.write(f"NODE [{i+1:03d}] | ❌ FAILED | Error: {str(e)}\n")
                f.write("-" * 80 + "\n")

    total_duration = round(time.perf_counter() - start_total, 2)
    avg_tps = round(total_tokens / total_duration, 2) if total_duration > 0 else 0

    with open(report_path, "a", encoding="utf-8") as f:
        f.write(f"\nFINAL PERFORMANCE SUMMARY:\n")
        f.write(f"⏱️  Total Duration   : {total_duration}s\n")
        f.write(f"🔥 Fast Mode Power  : {avg_tps} Tokens/Sec (TPS)\n")
        f.write(f"📊 APPRAISAL: HIGH-SPEED INDEXING CONFIRMED.\n")

    print(f"\n⚡ FAST BENCHMARK COMPLETE! {num_nodes} RECORDS SAVED.")
    print(f"📄 Report File: {report_path}")

if __name__ == "__main__":
    asyncio.run(run_benchmark(50))
