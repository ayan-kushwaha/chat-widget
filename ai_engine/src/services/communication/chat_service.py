import json
import asyncio
import os
from src.core.brain import brain
from src.core.memory import memory
from src.core.config import settings
from src.utils.logger import logger
from src.services.ai.ambiguity_engine import AmbiguityEngine
from src.services.prompt.architect import prompt_architect
from src.services.behavior.journey import journey_service
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import AsyncGenerator

# Import with fallback for different structures
try:
    from src.services.function_calling_service import FunctionCallingService
    from src.services.api_handler_service import FlexibleAPIHandler
except ImportError:
    # If direct import fails, services might be available
    try:
        from function_calling_service import FunctionCallingService
        from api_handler_service import FlexibleAPIHandler
    except ImportError:
        FunctionCallingService = None
        FlexibleAPIHandler = None
        
import redis

class ChatService:
    def __init__(self):
        # Initialize Function Calling service for live API queries
        self.function_calling = None
        
        if FunctionCallingService and FlexibleAPIHandler:
            try:
                redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
                api_handler = FlexibleAPIHandler(redis_client)
                self.function_calling = FunctionCallingService(api_handler, None)  # MongoDB client passed later
            except Exception as e:
                logger.warning(f" Function Calling not initialized: {e}")
        else:
            logger.warning(" FunctionCallingService or FlexibleAPIHandler not available")
    
    async def chat_completion(
        self, 
        query: str, 
        user_id: str, 
        history: list = [], 
        system_instruction: str = None,
        rag_config: dict = None,
        model_preference: str = "auto",
        config: dict = None,
        selected_source_id: str = None,
        screen_context: dict = None,  #  SKILL 13: Live page context from widget
        reply_to_mongo_id: str = None #  PHASE 5: Telecom wiring for teleportation
    ) -> AsyncGenerator[str, None]:
        """
        Refactored as Async Generator for Transparent Thinking UI.
        Yields NDJSON chunks with status updates.
        """
        try:
            import time
            start_total = time.perf_counter()
            
            # STEP 0: INITIALIZATION
            from src.services.ai.memory_engine import memory_engine
            
            # --- SHADOW BOSS STREAM INJECTION (V6) ---
            yield json.dumps({"status": "thinking", "step": "shadow_boss", "message": " Shadow Boss scanning intent..."}) + "\n"
            from src.services.ai.shadow_boss import shadow_boss
            
            historical_summary = "None"
            if len(history) > 1:
                historical_summary = f"Last {min(3, len(history)-1)} messages available."
                
            sb_context = {
                "chattingTo": "user",
                "speaker_role": "CUSTOMER",
                "speaker_profile": "Standard registered user",
                "historical_sms_summary": historical_summary,
                "active_employee": "System Assigned"
            }
            sb_message = {
                "channelSource": "web",
                "text": query,
                "attachment": None,
                "timestamp": "now"
            }
            
            #  RUN 4B FAST AUDIT
            sb_start = time.perf_counter()
            sb_analysis = await shadow_boss.analyze(sb_context, sb_message)
            if sb_analysis:
                sb_latency = (time.perf_counter() - sb_start) * 1000
                logger.info(f" Shadow Boss Done in {sb_latency:.2f}ms")
                #  BROADCAST METRICS TO FRONTEND
                yield json.dumps({
                    "status": "shadow_boss_scan",
                    "step": "shadow_boss",
                    "data": sb_analysis
                }) + "\n"
                #  ROUTING STEP  emit intent extract + mark shadow_boss done
                intent_summary = sb_analysis.get("intent_layer", {}).get("dynamic_intent_summary", "")
                yield json.dumps({
                    "status": "thinking",
                    "step": "routing",
                    "message": " Routing to best employee...",
                    "data": {"intent": intent_summary[:80] if intent_summary else ""}
                }) + "\n"
            else:
                logger.warning(" Shadow Boss Timeout. Falling back to default RAG.")
            
            # IMPORTS (Rule: Lazy import to avoid circular dep at top level)
            from src.services.prompt.architect import label_architect
            from src.core.learning.feedback_manager import get_feedback_manager
            
            feedback_mgr = get_feedback_manager()
            
            logger.info(f" Chat Request from {user_id}: {query} (ForcedSource: {selected_source_id})")
            
            # ---  [Phase 5.5] WIRING SURGERY: Spawn EpisodeNeuron ---
            try:
                from src.services.neural.neurons.factory import factory
                import uuid
                
                # 1. Spawn Episode Neuron Physically in Neo4j
                ep_id = f"ep_{uuid.uuid4().hex[:8]}"
                ep_neuron = factory.spawn("Episode", ep_id, org_id, name=f"Msg_{ep_id}")
                
                # We do this asynchronously so it doesn't block the fast Chat UI stream
                asyncio.create_task(ep_neuron.sync_to_neo4j({"text": query, "user_id": user_id}))
                
                # 2. Async Subconscious Triggering
                # Pass to the Level 4 Subconscious Router for background graph logic computation
                from src.services.neural.subconscious.router_gguf import subconscious_router
                # Running blocking GGUF in background thread
                asyncio.create_task(asyncio.to_thread(
                    subconscious_router.determine_action_path, 
                    query, 
                    [{"id": "session_"+user_id, "name": "ActiveThread", "type": "SessionNeuron", "mces_score": 0.95}]
                ))
            except Exception as ne:
                logger.warning(f" [NeuralOS] Background neural sync failed: {ne}")
            # --- END WIRING SURGERY ---
            
            # Extract orgId
            org_id = rag_config.get('org_id', user_id) if rag_config else user_id
            
            # Extract UI Config parts
            persona_config = (config or {}).get('persona', {})
            behavior_config = (config or {}).get('behavior', {})
            journey_config = behavior_config.get('journey', [])
            memory_policy = behavior_config.get('memoryPolicy', '30_DAY')
            auto_learned_facts = (config or {}).get('facts', [])
            org_name = (config or {}).get("orgName", "this organization")

            # ----------------------------------------------------
            #  0. AMBIGUITY DETECTION SYSTEM (ADS) - Rule 5 & 13
            # ----------------------------------------------------
            forced_source_id = selected_source_id # Start with selected ID if any
            forced_mission_text = None
            is_statement = False
            ads_suggestions = [] # To store options from ADS for later merging

            # --- V5 STATEFUL BYPASS LOGIC ---
            if sb_analysis:
                from src.services.ai.memory_engine import session_manager
                topic_steer = sb_analysis.get('psychology_layer', {}).get('topic_steer', '')
                if topic_steer == 'ai_must_re_route':
                    logger.info(f" [Handover] Topic Drift Detected by Shadow Boss. Handover Required.")
                    session_manager.clear_session(user_id)
                elif not forced_source_id:
                    sticky_id = session_manager.get_active_session(user_id)
                    if sticky_id:
                        forced_source_id = sticky_id

            try:
                ads = AmbiguityEngine(org_id)
                await ads.refresh_knowledge_map()
                
                # If we have a forced source from button or STICKY SESSION, verify it exists
                if forced_source_id:
                    for src in ads.sources:
                        if src['id'] == forced_source_id:
                            if src['type'] == 'flow': forced_mission_text = src.get('full_desc')
                            logger.info(f" [ADS] Source Forced via ID/Session: {src['text']}")
                            break

                # A. Analysis pass
                from src.services.prompt.architect import label_architect
                
                if forced_source_id:
                    # Skip heavy vector analysis, just mock a confirmed state
                    analysis = {"status": "confirmed", "match": {"id": forced_source_id, "text": "Sticky Session Topic"}}
                    is_statement = memory_engine.is_likely_statement(query)
                else:
                    # Pass org_name to ADS analysis
                    analysis = await ads.analyze_intent(query, org_name=org_name)
                    is_statement = memory_engine.is_likely_statement(query)
                
                # Handling Identity Intent (The "Ramu" Fix)
                if analysis.get("status") == "identity_intent":
                    logger.info(f" [Chat] Identity Intent Confirmed. Bypassing Gates.")
                    # We treat this as a confirmed intent to allow RAG to fetch org details
                    # No forced source ID means it will query the broad RAG based on org name
                    pass
                
                top_match_score = analysis.get("score", 0)

                # --- GATE 1: THE "NO DATA" BLOCK (Rule 13) ---
                is_short_query = len(query.strip()) < 10

                if not forced_source_id and not is_short_query and top_match_score < 0.35 and analysis["status"] == "unknown":
                    logger.info(f" [Rule 13] Low Confidence ({top_match_score}). Gemini Call Blocked (0).")
                    
                    import re
                    
                    # Clean topics for natural speech
                    topics = []
                    if ads.sources:
                        for s in ads.sources:
                            t = s['text']
                            # Remove emojis and standard prefixes
                            t = re.sub(r'^[]\s*', '', t) 
                            t = re.sub(r'^(Info from|Detail about|Step:)\s*', '', t, flags=re.IGNORECASE)
                            # Remove file extensions
                            t = re.sub(r'\.(pdf|json|csv|xlsx?|txt)$', '', t, flags=re.IGNORECASE)
                            topics.append(t.strip())
                    
                    topics = topics[:3] if topics else ["our services"]
                    topics_str = ", ".join(topics[:-1]) + (" or " + topics[-1] if len(topics) > 1 else topics[0]) if topics else "our services"
                    
                    #  NON-REPETITIVE FALLBACK
                    fallback_text = (
                        f"I'm sorry, I couldn't find detailed information about \"{query}\" in {org_name}'s database. "
                        f"However, I can definitely discuss {topics_str} if that helps."
                    )
                    
                    yield json.dumps({
                        "status": "final",
                        "response": fallback_text,
                        "ui_type": "options_list",
                        "options": await label_architect.build_suggestion_labels(query, ads.sources[:3]) if ads.sources else [],
                        "model_used": "confidence-gate-v1",
                        "data_source": "static_fallback",
                        "usage": {"total_tokens": 0}
                    }) + "\n"
                    return

                # B. Selection Detection (Text Match Fallback)
                if not forced_source_id:
                    for src in ads.sources:
                        if query.strip().lower() == src['text'].strip().lower():
                            forced_source_id = src['id']
                            if src['type'] == 'flow': forced_mission_text = src.get('full_desc')
                            logger.info(f" [ADS] Selection Detected: {src['text']}")
                            break

                # C. Confirmed Match
                if not forced_source_id and analysis.get("status") == "confirmed":
                    forced_source_id = analysis["match"]["id"]
                    if analysis["match"].get("type") == "flow": forced_mission_text = analysis["match"].get('full_desc')
                    logger.info(f" [ADS] Intent Confirmed: {analysis['match']['text']}")
                
                # LOCK IN SESSION (For future bypasses)
                if forced_source_id:
                    from src.services.ai.memory_engine import session_manager
                    session_manager.set_active_session(user_id, forced_source_id)
                
                # D. Ambiguous Resolution
                if not forced_source_id and analysis.get("status") == "ambiguous":
                    logger.info(f" [ADS] Query Ambiguous. Skipping Gemini call for speed.")
                    suggestions = await label_architect.build_suggestion_labels(query, analysis.get("options", []))
                    
                    yield json.dumps({
                        "status": "final",
                        "response": "I found a few related things in our records. To give you the best answer, could you please select one of these?",
                        "ui_type": "options_list",
                        "options": suggestions,
                        "model_used": "ambiguity-engine-v2",
                        "data_source": "semantic_map",
                        "usage": {"total_tokens": 0}
                    }) + "\n"
                    return
                    
            except Exception as ads_err:
                logger.error(f" ADS Error: {ads_err}")

            ads_latency = (time.perf_counter() - start_total) * 1000
            logger.info(f"         [Latency] ADS Pass: {ads_latency:.2f}ms")
            # Padding (8 spaces) to mask environment character-doubling at index 7

            # ----------------------------------------------------
            #  1. MISSION DETECTION (Rule 2)
            # ----------------------------------------------------
            current_mission_text = forced_mission_text
            last_metadata = {}
            if history:
                last_metadata = history[-1].get('metadata', {})
            
            if not current_mission_text:
                current_step = journey_service.get_current_step(
                    query, 
                    history, 
                    journey_config, 
                    last_metadata.get('step_id')
                )
                if current_step:
                    current_mission_text = current_step.get('system_instruction')
                    # PASS JOURNEY CONTEXT TO CONTEXT MANAGER (RULE 2 SYNERGY)
                    from src.brain.global_context import ContextManager
                    ctx_obj = ContextManager.get_context(user_id)
                    ctx_obj.update("current_journey_step", current_step.get('title'))
                    ctx_obj.update("step_id", current_step.get('id'))
                    logger.info(f" [Journey] Currently in Step: {current_step.get('title')}")

            # ----------------------------------------------------
            #  2. FUNCTION CALLING & RAG
            # ----------------------------------------------------
            # --- FACT RECALL & RAG (Parallelized for Performance) ---
            yield json.dumps({"status": "thinking", "step": "rag_scan", "message": " Scanning knowledge base..."}) + "\n"
            
            # --- SHARED EMBEDDING (Rule 11 Optimization) ---
            query_embedding = None
            try:
                # Use memory-manager's internal async_client
                start_embed_total = time.perf_counter()
                resp = await memory.async_client.post(
                    f"{memory.ollama_url}/api/embed",
                    json={"model": settings.OLLAMA_EMBED_MODEL, "input": query},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    query_embedding = resp.json().get("embeddings", [[]])[0]
                    embed_latency = (time.perf_counter() - start_embed_total) * 1000
                    logger.info(f"         [Latency] Shared Ollama Embedding: {embed_latency:.2f}ms")
            except Exception as e:
                logger.warning(f" Shared Embedding Failed: {e}")

            # Prepare parallel tasks
            tasks = []
            
            # Task 1: Fact Recall
            if memory_policy != 'SESSION_ONLY':
                tasks.append(memory_engine.recall_facts(user_id, query, query_embedding=query_embedding))
            else:
                tasks.append(asyncio.sleep(0, result="")) # Dummy task if skipped
                
            # Task 2: Knowledge RAG
            if rag_config:
                filter_params = {}
                if forced_source_id and 'ads' in locals():
                    for src in ads.sources:
                        if src['id'] == forced_source_id:
                            filter_params = {"sourceId": forced_source_id}
                            break
                tasks.append(memory.query_similar(
                    query, 
                    n_results=8,
                    collection_name=org_id,
                    where=filter_params if forced_source_id else None,
                    query_embedding=query_embedding
                ))
            else:
                tasks.append(asyncio.sleep(0, result=[])) # Dummy task

            # Execute Parallelly
            recalled_facts, rag_docs = await asyncio.gather(*tasks)

            context_text = ""
            sources = []
            data_source = "rag"

            if recalled_facts:
                context_text += f"\n\n--- PRIMARY USER DATA (MUST USE FOR IDENTITY) ---\n{recalled_facts}\n"

            if rag_docs:
                # Inject forced source info if available
                if forced_source_id and 'ads' in locals():
                    for src in ads.sources:
                        if src['id'] == forced_source_id:
                            context_text += f"\n\n--- TARGET SOURCE INFO ---\n[Source Name: {src['text']}]\nDescription: {src['full_desc']}\n"
                            break
                
                context_text += "\n\n--- RELEVANT KNOWLEDGE BASE ---\n" + "\n\n".join([f"[Source: {d['metadata'].get('title', 'Internal Knowledge')}]\n{d['content']}" for d in rag_docs])
                sources = [d['metadata'] for d in rag_docs]
            elif forced_source_id:
                logger.warning(f" [RAG] No vector hits for forced source {forced_source_id}. Using base source info only.")

            rag_latency = (time.perf_counter() - start_total) * 1000 - ads_latency
            logger.info(f"         [Latency] RAG/Memory Pass: {rag_latency:.2f}ms")

            # ----------------------------------------------------
            #  3. DYNAMIC PROMPT ASSEMBLY (Rule 1)
            # ----------------------------------------------------
            yield json.dumps({
                "status": "thinking",
                "step": "security",
                "message": " Iron Dome security check...",
                "data": {
                    "pii_safe": not (sb_analysis or {}).get("security_iron_dome", {}).get("I3_pii_leak_risk", {}).get("detected", False)
                }
            }) + "\n"
            
            # Clean Knowledge Topics (Remove extensions for human-like speech)
            import re
            raw_topics = [s['text'] for s in ads.sources] if 'ads' in locals() and ads.sources else []
            knowledge_topics = [re.sub(r'\.(pdf|json|csv|xlsx?|txt)$', '', t, flags=re.IGNORECASE) for t in raw_topics][:3]

            final_system_instruction = prompt_architect.build_system_instruction(
                persona_config=persona_config,
                current_mission=current_mission_text,
                context_text=context_text,
                auto_learned_facts=auto_learned_facts,
                is_discovery_mode=is_statement,
                org_name=org_name,
                knowledge_topics=knowledge_topics
            )

            # ----------------------------------------------------
            #  4. GEMINI EXECUTION (Stateless)
            # ----------------------------------------------------
            yield json.dumps({"status": "thinking", "step": "drafting", "message": " Drafting response..."}) + "\n"
            
            prompt_latency = (time.perf_counter() - start_total) * 1000 - ads_latency - rag_latency
            logger.info(f"         [Latency] Prompt Assembly: {prompt_latency:.2f}ms")
            
            from src.services.ai.chat_service import chat_ai_service
            
            # --- CONDITIONAL HISTORY (Rule 12: Token Saver) ---
            history_for_gemini = []
            
            if memory_policy == 'SESSION_ONLY':
                # No vector recall, so we need more history context
                logger.info(f" [Memory] Policy: Session Only. Sending Last 5 messages.")
                for msg in history[-5:]:
                    role = "user" if msg.get('role') == 'user' else "model"
                    content = msg.get('content') or msg.get('text')
                    history_for_gemini.append({"role": role, "text": content})
            else:
                has_dependency = memory_engine.check_dependency(query)
                if has_dependency:
                    logger.info(f" [History] Dependency Detected. Sending Last 2 messages.")
                    for msg in history[-2:]:
                        role = "user" if msg.get('role') == 'user' else "model"
                        content = msg.get('content') or msg.get('text')
                        history_for_gemini.append({"role": role, "text": content})
                else:
                    logger.info(f" [History] Independent Query. Skipping history to save tokens.")

            #  SKILL 13: Inject screen_context into system prompt if provided
            if screen_context and isinstance(screen_context, dict):
                live_page_ctx = [
                    f"Current URL: {screen_context.get('current_url', 'unknown')}",
                    f"Page Title: {screen_context.get('page_title', 'unknown')}",
                ]
                if screen_context.get('visible_buttons'):
                    buttons_str = ", ".join(screen_context['visible_buttons'][:15])
                    live_page_ctx.append(f"Visible Buttons/Links: {buttons_str}")
                if screen_context.get('h1'):
                    live_page_ctx.append(f"Page Heading: {screen_context['h1']}")
                
                screen_block = (
                    "\n\n[LIVE PAGE CONTEXT - user is currently viewing this]\n"
                    + "\n".join(live_page_ctx)
                    + "\n[END LIVE CONTEXT]\n"
                )
                final_system_instruction = final_system_instruction + screen_block
                logger.info(f" [Skill13] Screen context injected: {screen_context.get('current_url')}")

            #  STREAMING EXECUTION (The Tunnel)
            full_response_text = ""
            usage_data = {"total_tokens": 0} # Placeholder until stream supports usage
            
            async for chunk in chat_ai_service.generate_response_stream(
                user_message=query,
                user_id=user_id,
                conversation_history=history_for_gemini,
                system_instruction=final_system_instruction,
                context={"org_id": org_id},
                reply_to_mongo_id=reply_to_mongo_id
            ):
                full_response_text += chunk
                #  EMIT CHUNK (Zero Latency)
                yield json.dumps({
                    "status": "stream",
                    "token": chunk
                }) + "\n"
            
            response_text = full_response_text
            result = {"text": response_text, "usage": usage_data}
            
            # --- NATIVE SUGGESTIONS (Rule 14: Post-Process) ---
            # label_architect was already imported at the top of the try block
            follow_up_options = await label_architect.generate_follow_up_questions(query, response_text, history)
            
            # Merge options from ADS (if any were stored) and follow-up questions
            final_options = ads_suggestions + follow_up_options
            
            ui_action = None #  Initialize fallback for Skill 13

            # ----------------------------------------------------
            #  5. AUTO-LEARNING (POST-PROCESS)
            # ----------------------------------------------------
            new_learning = None
            if response_text and len(response_text) > 5:
                # We still DISCOVER facts (for the studio dashboard)
                new_learning = await memory_engine.discover_new_learnings(query, response_text)
                
                # --- AUTO-SAVE FACT (Rule 11) ---
                # Only save to persistent Vector DB if policy allows
                if new_learning and memory_policy != 'SESSION_ONLY':
                    await memory_engine.save_fact(user_id, org_id, new_learning)

            # --- AUTO-LEARN INTENT SYNERGY ---
            if 'analysis' in locals():
                await feedback_mgr.auto_learn(query, response_text, analysis.get("match"))

            from src.config.model_routing import master_model_router, TaskType
            core_route = await master_model_router.get_route(TaskType.CORE_CHAT)

            yield json.dumps({
                "status": "final",
                "response": response_text,
                "sources": sources,
                "options": final_options,
                "ui_action": ui_action,  #  SKILL 13: None if no action, dict if AI triggered action
                "model_used": core_route["model_name"],
                "data_source": data_source,
                "usage": result.get("usage", {}),
                "resource_metrics": {
                    "cpu_secs": round(time.perf_counter() - start_total, 4),
                    "task_density": 0.2
                },
                "metadata": {
                    "step_id": current_step.get('id') if 'current_step' in locals() and current_step else None,
                    "new_learning": new_learning
                }
            }) + "\n"

        except Exception as e:
            logger.error(f" Chat Error: {str(e)}")
            yield json.dumps({"status": "error", "message": str(e)}) + "\n"

chat_service = ChatService()
