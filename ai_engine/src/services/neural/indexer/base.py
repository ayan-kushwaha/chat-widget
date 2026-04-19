"""

    NEURAL INDEXER  Base (Shared Logic)                        
  Cluaiz Neural OS | services/neural/indexer/base.py              
                                                                  
  Shared by: file_indexer, site_indexer, manual_indexer,          
             api_indexer                                          
                                                                  
  Contains:                                                       
    - Qwen 0.8b summarization                                     
    - Confidence scoring                                          
    - Single node builder                                         

"""

import re
import uuid

from loguru import logger

MAX_SUMMARY_WORDS = 40


#  Node Builder 

async def build_node(chunk: dict, index: int, vector_id: str = None) -> dict:
    """
    Build a single YAML tree node with AI-enhanced metadata.
    """
    #  Get Smart Title + Clean Summary
    smart_title, summary = await summarize_with_qwen(chunk["body"], chunk["raw_title"])
    
    confidence = score_confidence(chunk)
    node_id    = f"node_{uuid.uuid4().hex[:8]}"

    return {
        "node_id":    node_id,
        "index":      index,
        "title":      smart_title,   #  AI-Generated Smart Title (3-4 words)
        "level":      chunk["level"],
        "summary":    summary,       #  AI-Generated Clean Summary (< 40 words)
        "word_count": chunk["word_count"],
        "confidence": confidence,
        "decay_rate": 0.0,
        "vector_ids": [vector_id] if vector_id else [],
    }


#  Qwen 0.8b Smart Meta-Extraction 

async def summarize_with_qwen(body: str, title: str) -> tuple[str, str]:
    """
    Calls Qwen 0.8b (via Ollama) to extract a Smart Title and Clean Summary.
    Returns: (title, summary)
    """
    def sanitize(text: str, is_title: bool = False) -> str:
        #  Hard-strip markdown and noise
        text = re.sub(r'#+|`+|\*+|_+|~+|>+|\[|\]|\(|\)', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        if is_title:
            # Title should be short: 3-5 words max
            words = text.split()
            return " ".join(words[:5]).title()
        return text

    fallback_title   = sanitize(title, is_title=True) or f"Section {uuid.uuid4().hex[:4]}"
    fallback_summary = sanitize(body[:200])

    try:
        from src.config.model_routing import master_model_router, TaskType, RouteDestination
        route = await master_model_router.get_route(TaskType.CHUNK_SUMMARY)
        
        async def try_ai(provider: RouteDestination, model_name: str) -> Optional[str]:
            prompt = (
                f"TEXT CONTENT: {body[:3000]}\n\n"
                f"INSTRUCTIONS:\n1. Create a 3-4 word 'Smart Title'.\n2. Write a 1-sentence 'Clean Summary'.\n"
                f"FORMAT:\nTitle: [Smart Title]\nSummary: [Clean Summary]"
            )
            try:
                if provider == RouteDestination.OLLAMA:
                    from src.core.ollama_client import ollama_client
                    res = await ollama_client.generate(prompt=prompt, model=model_name, temperature=0.1)
                    return res.get("text", "")
                else:
                    from src.core.gemini_client import gemini_client
                    from google.genai import types
                    import asyncio
                    from src.core.executor import executor
                    cfg = types.GenerateContentConfig(temperature=0.1, max_output_tokens=100)
                    res = await asyncio.get_event_loop().run_in_executor(
                        executor, lambda: gemini_client.models.generate_content(model=model_name, contents=prompt, config=cfg)
                    )
                    return res.text.strip() if res and res.text else ""
            except Exception as e:
                logger.warning(f" Provider '{provider.value}' failed: {e}")
                return None

        #  Try Primary
        res_text = await try_ai(route["provider"], route["model_name"])
        
        #  Try Fallback if primary fails
        if not res_text and route["provider"] == RouteDestination.OLLAMA:
            logger.info(" Falling back to Gemini...")
            res_text = await try_ai(RouteDestination.GEMINI, "gemini-2.0-flash-lite-001")

        if not res_text: return fallback_title, fallback_summary

        #  Extract
        t_match = re.search(r'Title:\s*(.*?)(?=\n|Summary:|$)', res_text, re.I | re.S)
        s_match = re.search(r'Summary:\s*(.*)', res_text, re.I | re.S)
        ai_t = t_match.group(1).strip() if t_match else fallback_title
        ai_s = s_match.group(1).strip() if s_match else fallback_summary
        
        final_title   = sanitize(ai_t, True) or fallback_title
        final_summary = sanitize(ai_s) or fallback_summary

        # Truncate summary if too long
        s_words = final_summary.split()
        if len(s_words) > MAX_SUMMARY_WORDS:
            final_summary = " ".join(s_words[:MAX_SUMMARY_WORDS]) + "..."

        return final_title, final_summary

    except Exception as e:
        logger.warning(f"  [Base] Qwen failed for '{title}': {e}")
        return fallback_title, fallback_summary



#  Confidence Scoring 

def score_confidence(chunk: dict) -> float:
    """
    Score how well-structured a chunk is (0.0  1.0).
    """
    score = 0.5  # Base

    if not chunk["raw_title"].startswith("Section "):
        score += 0.3  # Real heading

    if 50 <= chunk["word_count"] <= 500:
        score += 0.2
    elif chunk["word_count"] > 500:
        score += 0.1

    if chunk["level"] in (1, 2):
        score += 0.1

    return round(min(score, 1.0), 2)
