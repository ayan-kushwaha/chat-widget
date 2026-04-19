"""

   YAML Graph Builder  5-Layer Memory Card Generator      
  Cluaiz Neural OS | research/yaml_graph_builder.py          
                                                              
  Role: Compress research + graph + history into a YAML       
        "Memory Card" for Gemini (saves 60-95% tokens)       
                                                              
  5 Layers:                                                   
    1. Identity     User mood + org rules                   
    2. Memory       Chat history focus summary              
    3. Query        Current user intent                     
    4. Research     Crawl4AI content (BM25 filtered)        
    5. KG Chunks    Relevant Neo4j knowledge nodes         

"""
import yaml
from typing import List, Dict, Any, Optional
from loguru import logger


class YamlGraphBuilder:
    """
    Builds a compact YAML '5-Layer Memory Card' to send to Gemini.
    
    Why YAML over JSON?
        - JSON:  {"key": "value"}  extra brackets, quotes = 30-60% token waste
        - YAML:  key: value        indentation only = 60% fewer tokens
    
    Token Budget (target < 2500 total):
        - Identity:   ~100 tokens
        - Memory:     ~200 tokens
        - Query:      ~50 tokens
        - Research:   ~1500 tokens (5 pages  300 each)
        - KG Chunks:  ~300 tokens
        - Overhead:   ~100 tokens
    """

    def build(
        self,
        query:         str,
        chat_history:  str               = "",
        focus_topic:   str               = "",
        user_mood:     str               = "neutral",
        org_rules:     List[str]         = None,
        research_data: List[Dict]        = None,
        kg_chunks:     List[Dict]        = None,
    ) -> str:
        """
        Build the YAML Memory Card.
        
        Args:
            query:         Current user message
            chat_history:  Summary of conversation so far
            focus_topic:   Main topic derived from FocusSummaryNeuron
            user_mood:     Derived from psychology layer
            org_rules:     Boss-level rules from BossNeuron
            research_data: List of {"url", "title", "content"} from Crawl4AI
            kg_chunks:     List of {"node", "content"} from Neo4j
        
        Returns:
            YAML string (compressed context for LLM)
        """
        org_rules     = org_rules     or []
        research_data = research_data or []
        kg_chunks     = kg_chunks     or []

        #  Layer 1: Identity 
        identity = {
            "mood":  user_mood,
            "rules": org_rules[:5]   # Limit to top 5 rules
        }

        #  Layer 2: Memory 
        memory = {
            "focus_topic":    focus_topic[:200] if focus_topic else "general",
            "chat_summary":   chat_history[:500] if chat_history else "No prior history"
        }

        #  Layer 3: Query Intent 
        query_layer = {
            "user_query": query[:300]
        }

        #  Layer 4: Research 
        # Keep each source short: title + 300 chars of content
        research_layer = []
        token_budget   = 1500
        tokens_used    = 0

        for item in research_data:
            content_preview = str(item.get("content", ""))[:400]
            approx_tokens   = len(content_preview) // 4

            if tokens_used + approx_tokens > token_budget:
                break

            research_layer.append({
                "source":  item.get("url", "unknown")[:80],
                "title":   item.get("title", "")[:80],
                "content": content_preview
            })
            tokens_used += approx_tokens

        #  Layer 5: Knowledge Graph 
        kg_layer = [
            {
                "node":    chunk.get("node", "")[:60],
                "content": chunk.get("content", "")[:300]
            }
            for chunk in kg_chunks[:5]   # Max 5 KG nodes
        ]

        #  Assemble the Memory Card 
        memory_card = {
            "identity":       identity,
            "memory":         memory,
            "current_query":  query_layer,
            "research":       research_layer,
            "knowledge_graph": kg_layer,
            "instruction":    (
                "Answer the user's query using the research and knowledge_graph provided. "
                "Be concise. Cite sources where relevant. "
                "Respect the org rules in identity."
            )
        }

        try:
            yaml_str = yaml.dump(
                memory_card,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
                width=120
            )
        except Exception as e:
            logger.error(f"[YamlGraphBuilder] YAML dump failed: {e}")
            yaml_str = str(memory_card)

        approx_tokens = len(yaml_str) // 4
        logger.info(f"[YamlGraphBuilder] Memory Card built: ~{approx_tokens} tokens")

        return yaml_str

    def estimate_tokens(self, yaml_str: str) -> int:
        return len(yaml_str) // 4


# Singleton
yaml_graph_builder = YamlGraphBuilder()
