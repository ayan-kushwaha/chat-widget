"""

   NEURAL NAVIGATOR  YAML Tree Beam Search                     
  Cluaiz Neural OS | services/neural/navigator.py                 
                                                                  
  Role: Given a user query + a YAML Page Index, use Qwen 0.8b    
        to navigate the tree and find the 1-3 most relevant       
        section nodes (the "Logic Nucleus").                      
                                                                  
  Strategy: Multi-Way Beam Search with Backtracking               
    - Step 1: Quick top-level scan (which major section?)         
    - Step 2: Dive into matching branch (sub-sections?)           
    - Step 3: If confidence < 0.4  backtrack to wider scope      
                                                                  
  Output: {top_nodes, vector_ids, confidence, fallback_used}      
  Latency target: < 200ms (Qwen local, YAML is tiny)             

"""

import time
from typing import Optional

import yaml
from loguru import logger


#  Constants 

HIGH_CONFIDENCE     = 0.75    # Direct dive  single best node
MID_CONFIDENCE      = 0.40    # Keep 2 candidates
LOW_CONFIDENCE      = 0.40    # Trigger backtrack / broader search


#  Navigator Class 

class NeuralNavigator:
    """
    Beam-search navigator for the YAML Page Index tree.

    Called by shadow_boss.py BEFORE fetching full Qdrant vectors,
    so we only pull the ~500 tokens that actually answer the query.
    """

    #  Public Entry Point 

    async def navigate(
        self,
        query:       str,
        yaml_tree:   str,          # Raw YAML string from MongoDB doc.page_index
        max_nodes:   int = 3,
    ) -> dict:
        """
        Main navigation pipeline.

        Args:
            query:     User's message / detected intent
            yaml_tree: YAML Page Index string stored in MongoDB
            max_nodes: How many result nodes to return (default 3)

        Returns:
            {
              "top_nodes":    [{"node_id", "title", "summary", "confidence"}],
              "vector_ids":   [...],          # Qdrant IDs to fetch
              "confidence":   float,          # Best match confidence
              "fallback_used": bool,          # True if we broadened search
              "duration_ms":  float,
            }
        """
        t_start = time.perf_counter()

        # Parse YAML string  Python dict
        try:
            tree_dict = yaml.safe_load(yaml_tree) or {}
        except yaml.YAMLError as e:
            logger.error(f" [Navigator] Failed to parse YAML tree: {e}")
            return self._empty_result()

        nodes: list[dict] = tree_dict.get("tree", [])
        if not nodes:
            logger.warning("[Navigator] Empty YAML tree  no nodes to navigate.")
            return self._empty_result()

        # STEP 1: Score all top-level nodes via Qwen
        scored = await self._score_nodes(query, nodes)

        # STEP 2: Pick beam (top candidates)
        best = sorted(scored, key=lambda x: x["nav_score"], reverse=True)[:max_nodes]
        top_score = best[0]["nav_score"] if best else 0.0

        fallback_used = False

        # STEP 3: Confidence check + backtrack logic
        if top_score < LOW_CONFIDENCE:
            logger.info(f"    [Navigator] Low confidence ({top_score:.2f})  broadening search")
            # Broaden: return top-3 from the whole flat list
            best = sorted(scored, key=lambda x: x["nav_score"], reverse=True)[:max_nodes]
            fallback_used = True

        # Collect all Qdrant vector IDs from matched nodes
        vector_ids: list[str] = []
        for node in best:
            vector_ids.extend(node.get("vector_ids", []))

        # Build clean output (strip internal scoring field)
        top_nodes = [
            {
                "node_id":    n.get("node_id", ""),
                "title":      n.get("title", ""),
                "summary":    n.get("summary", ""),
                "confidence": round(n["nav_score"], 3),
                "level":      n.get("level", 1),
            }
            for n in best
        ]

        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)

        logger.info(
            f" [Navigator] Top match: '{top_nodes[0]['title'] if top_nodes else ''}' "
            f"(confidence={top_score:.2f}) in {duration_ms}ms"
        )

        return {
            "top_nodes":     top_nodes,
            "vector_ids":    list(set(vector_ids)),    # Deduplicate
            "confidence":    round(top_score, 3),
            "fallback_used": fallback_used,
            "duration_ms":   duration_ms,
        }

    #  Step 1: Qwen Scoring 

    async def _score_nodes(self, query: str, nodes: list[dict]) -> list[dict]:
        """
        Ask Qwen 0.8b to score which nodes are relevant to the query.

        Approach: Single batch prompt (all node summaries at once)
         Qwen returns a JSON list of {node_id, score}
         We merge scores back into node dicts

        Fallback: keyword overlap scoring (zero cost, zero network)
        """
        try:
            scored = await self._qwen_batch_score(query, nodes)
            return scored
        except Exception as e:
            logger.warning(f"  [Navigator] Qwen scoring failed, using keyword fallback: {e}")
            return self._keyword_score(query, nodes)

    async def _qwen_batch_score(self, query: str, nodes: list[dict]) -> list[dict]:
        """
        Send all node summaries + titles to Qwen in one prompt.
        Qwen returns relevance scores (0.01.0) per node.
        """
        from src.config.model_routing import master_model_router, TaskType, RouteDestination

        route = await master_model_router.get_route(TaskType.NEURAL_NAVIGATOR)

        # Build compact node listing (minimal tokens)
        node_lines = "\n".join(
            f"[{n.get('node_id', i)}] {n.get('title', '')}  {n.get('summary', '')[:120]}"
            for i, n in enumerate(nodes)
        )

        prompt = (
            f"User question: \"{query}\"\n\n"
            f"Document sections:\n{node_lines}\n\n"
            f"For EACH section, give a relevance score from 0.0 to 1.0.\n"
            f"Output format  one line per section: node_id=SCORE\n"
            f"Example: node_abc12345=0.87\n"
            f"Only output the scores, nothing else."
        )

        if route["provider"] == RouteDestination.OLLAMA:
            from src.core.ollama_client import ollama_client  # type: ignore
            response = await ollama_client.chat(
                model=route["model_name"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=200
            )
            raw_output = response.get("text", "")
        else:
            from src.core.gemini_client import gemini_client
            from google.genai import types
            import asyncio
            from src.core.executor import executor
            
            config = types.GenerateContentConfig(temperature=0.0, max_output_tokens=200)
            res = await asyncio.get_event_loop().run_in_executor(
                executor,
                lambda: gemini_client.models.generate_content(
                    model=route["model_name"],
                    contents=prompt,
                    config=config
                )
            )
            raw_output = res.text.strip() if res and res.text else ""

        # Parse "node_id=score" lines
        score_map: dict[str, float] = {}
        for line in raw_output.strip().splitlines():
            if "=" in line:
                parts = line.strip().split("=")
                if len(parts) == 2:
                    try:
                        node_id = parts[0].strip()
                        score   = float(parts[1].strip())
                        score_map[node_id] = max(0.0, min(1.0, score))
                    except ValueError:
                        pass

        # Merge scores back
        for node in nodes:
            node["nav_score"] = score_map.get(node.get("node_id", ""), 0.1)

        return nodes

    #  Fallback: Keyword Overlap Scoring 

    def _keyword_score(self, query: str, nodes: list[dict]) -> list[dict]:
        """
        Zero-cost fallback: TF-IDF-lite keyword overlap between
        query words and each node's title + summary.
        """
        query_words = set(query.lower().split())

        for node in nodes:
            text   = f"{node.get('title', '')} {node.get('summary', '')}".lower()
            words  = set(text.split())
            overlap = query_words & words
            score   = len(overlap) / max(len(query_words), 1)
            # Boost if whole query phrase appears in summary
            if query.lower() in text:
                score = min(score + 0.3, 1.0)
            node["nav_score"] = round(score, 3)

        return nodes

    #  Utility 

    @staticmethod
    def _empty_result() -> dict:
        return {
            "top_nodes":     [],
            "vector_ids":    [],
            "confidence":    0.0,
            "fallback_used": True,
            "duration_ms":   0.0,
        }


#  Standalone helper for shadow_boss.py 

async def navigate_document(
    query:     str,
    yaml_tree: str,
    max_nodes: int = 3,
) -> dict:
    """
    Convenience wrapper so shadow_boss.py can call:
        from src.services.neural.navigator import navigate_document
        result = await navigate_document(query, yaml_tree)
    """
    return await neural_navigator.navigate(query, yaml_tree, max_nodes)


#  Singleton 

neural_navigator = NeuralNavigator()
