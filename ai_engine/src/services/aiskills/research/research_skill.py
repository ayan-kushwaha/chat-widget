"""

   ResearchContract  Neural Web Research Skill            
  Cluaiz Neural OS | aiskills/research/research_skill.py     
                                                              
  SemanticContract V2  Plugs into existing skill pipeline    
                                                              
  Full Flow:                                                  
    1. SearxNG search (free, unlimited)                      
    2. Crawl4AI content extraction (BM25 fit_markdown)       
    3. Browser-Use for anti-bot sites                        
    4. Neo4j KG chunks fetch                                 
    5. 5-Layer YAML memory card build                        
    6. Gemini call with YAML context                         
    7. EpisodeNeuron.research_sources property update        

"""
from __future__ import annotations
import asyncio
from typing import Dict, Any, List, Optional, Type

from pydantic import BaseModel, Field
from loguru import logger

from src.services.aiskills.engine.base_skill import SemanticContract
from src.services.aiskills.types import ContextPackage

from .searxng_client    import searxng_client
from .crawl4ai_reader   import crawl4ai_reader, ANTI_BOT_DOMAINS
from .browser_use_reader import browser_use_reader
from .yaml_graph_builder import yaml_graph_builder


#  Input Schema 

class ResearchInput(BaseModel):
    query:        str   = Field(..., description="User question or research topic")
    chat_history: str   = Field("", description="Summarized prior conversation")
    focus_topic:  str   = Field("", description="FocusSummaryNeuron topic string")
    user_mood:    str   = Field("neutral", description="User mood from psychology layer")
    org_rules:    List[str] = Field(default_factory=list, description="Boss rules from BossNeuron")
    num_results:  int   = Field(5, ge=1, le=10, description="Number of web results to fetch")
    episode_id:   Optional[str] = Field(None, description="Current EpisodeNeuron ID for graph linking")


#  The Research Skill 

class ResearchContract(SemanticContract):
    """
    Neural Web Research Skill.
    
    Triggered when a user's query requires real-time web information that
    cannot be answered by the existing knowledge graph alone.
    
    Architecture: SearxNG  Crawl4AI/Browser-Use  YAML Graph  Gemini
    Token Budget:  ~2,500 total (vs 50,000+ without this system)
    """

    capability_statement = (
        "Research current information from the web. "
        "Search the internet for recent news, facts, articles, prices, reviews, "
        "social media discussions, or any live data the AI doesn't know internally."
    )

    allowed_roles = ["customer", "boss"]
    pii_fields    = []

    @property
    def input_schema(self) -> Type[BaseModel]:
        return ResearchInput

    async def _run(
        self,
        params: ResearchInput,
        entities: Dict[str, Any],
        context_package: ContextPackage,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute the full research pipeline.
        """
        logger.info(f"[ResearchSkill] Starting research for: '{params.query[:80]}'")

        #  Step 1: SearxNG Search 
        search_results = await searxng_client.search(
            query=params.query,
            num_results=params.num_results
        )

        if not search_results:
            logger.warning("[ResearchSkill] SearxNG returned 0 results. Check Docker setup.")

        #  Step 2: Extract content from URLs (parallel) 
        urls = [r["url"] for r in search_results]
        content_tasks = [self._fetch_url_content(url, params.query) for url in urls]
        research_data = await asyncio.gather(*content_tasks, return_exceptions=False)

        # Filter empty results
        research_data = [r for r in research_data if r.get("content")]

        #  Step 3: Get KG Chunks from ContextPackage 
        kg_chunks = []
        for chunk in context_package.kb_chunks[:5]:
            if hasattr(chunk, "content") and hasattr(chunk, "node_id"):
                kg_chunks.append({
                    "node":    getattr(chunk, "node_id", "KGNode"),
                    "content": str(chunk.content)[:300]
                })

        #  Step 4: Build YAML Memory Card 
        yaml_memory_card = yaml_graph_builder.build(
            query=params.query,
            chat_history=params.chat_history,
            focus_topic=params.focus_topic,
            user_mood=params.user_mood,
            org_rules=params.org_rules,
            research_data=research_data,
            kg_chunks=kg_chunks
        )

        estimated_tokens = yaml_graph_builder.estimate_tokens(yaml_memory_card)
        logger.info(f"[ResearchSkill] YAML Memory Card: ~{estimated_tokens} tokens")

        #  Step 5: Call Gemini with YAML Context 
        answer = await self._call_gemini(yaml_memory_card, params.query)

        #  Step 6: Attach sources to EpisodeNeuron (no new nodes!) 
        source_urls = [r["url"] for r in research_data]
        if params.episode_id and source_urls:
            await self._attach_sources_to_episode(params.episode_id, source_urls)

        return {
            "answer":          answer,
            "sources":         source_urls,
            "yaml_token_cost": estimated_tokens,
            "results_count":   len(research_data),
            "search_results":  [{"title": r["title"], "url": r["url"]} for r in search_results]
        }

    async def _fetch_url_content(self, url: str, query: str) -> dict:
        """Route to Crawl4AI or Browser-Use based on domain."""
        is_social = any(d in url for d in ANTI_BOT_DOMAINS)
        if is_social:
            return await browser_use_reader.read(url, query)
        return await crawl4ai_reader.read(url, query)

    async def _call_gemini(self, yaml_context: str, query: str) -> str:
        """Call Gemini with the YAML Memory Card as context."""
        try:
            from src.core.gemini_client import gemini_client

            prompt = (
                "You are a helpful research assistant. "
                "Below is a structured YAML context with 5 layers:\n"
                "  - identity: user mood and org rules\n"
                "  - memory: relevant conversation history\n"
                "  - current_query: what the user needs\n"
                "  - research: live web content fetched for this query\n"
                "  - knowledge_graph: internal knowledge base chunks\n\n"
                f"YAML CONTEXT:\n---\n{yaml_context}\n---\n\n"
                "Answer the user's query using the provided context. "
                "Be concise and cite sources when using web research."
            )

            response = await gemini_client.generate(prompt)
            return response

        except Exception as e:
            logger.error(f"[ResearchSkill] Gemini call failed: {e}")
            return f"Research completed but Gemini response failed: {str(e)}"

    async def _attach_sources_to_episode(self, episode_id: str, source_urls: List[str]):
        """
        Attach research sources as a property on the EpisodeNeuron.
        NO NEW NODES  keeps the graph clean.
        """
        try:
            from src.database.neo4j_client import neo4j_client
            await neo4j_client.run(
                """
                MATCH (e:EpisodeNeuron {id: $episode_id})
                SET e.research_sources = $sources,
                    e.last_researched  = timestamp()
                """,
                episode_id=episode_id,
                sources=source_urls[:10]
            )
            logger.success(f"[ResearchSkill] Attached {len(source_urls)} sources to Episode {episode_id}")
        except Exception as e:
            logger.warning(f"[ResearchSkill] Could not attach sources to Neo4j: {e}")
