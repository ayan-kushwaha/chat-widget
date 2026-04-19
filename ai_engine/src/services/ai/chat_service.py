import json
import os
import sys
import asyncio
from google.genai import types
from .base import BaseAIService
from src.core.config import settings
from src.utils.logger import logger
from src.core.orchestrator import orchestrator
from src.brain.global_context import ContextManager
from src.services.neural.graph_manager.orchestrator import graph_orchestrator

class ChatAIService(BaseAIService):
    """
    Real-time chat response service using Gemini 2.0 Flash-Lite.
    Optimized for Speed (Latency) and Cost.
    """
    
    async def generate_response_stream(self, user_message: str, user_id: str, conversation_history: list = None, system_instruction: str = None, context: dict = {}, reply_to_mongo_id: str = None):
        """Streaming response with V2 Brain Routing."""
        
        # 0. Resolve Context for this User
        ctx_obj = ContextManager.get_context(user_id)
        # Merge incoming transient context if provided (e.g. from RAG or Frontend overrides)
        if context:
            for k, v in context.items(): ctx_obj.update(k, v)
        
        current_context = ctx_obj.to_dict()

        # 1. Ask Orchestrator: "Who handles this?" (Phase vs Employee)
        # NEW: Orchestrator returns a 4-tuple now: (system_type, handler_id, confidence, audit)
        system_type, handler_id, confidence, audit = await orchestrator.route(user_message, user_id, current_context)
        
        # Security Guardrail
        if system_type == "security":
            yield f" SECURITY ALERT: Your request was flagged as {audit.get('reason', 'unsafe')}. Please keep the conversation professional."
            return

        worker_instance = orchestrator.get_worker(system_type, handler_id)
        
        # --- NEW: Employee Flow (Back Office) ---
        if system_type == "employee":
            # Employees have their own simple execute loop for now
            print(f" ORCHESTRATOR: Routing to Employee {handler_id}")
            agent_result = await worker_instance.execute(user_message, current_context)
            yield agent_result["reply"]
            return

        # --- LEGACY: Phase Flow (Front Office) ---
        phase_instance = worker_instance
        
        # 2. Give Specialist a Chance to Execute Logic (Pre-LLM)
        phase_result = await phase_instance.execute(user_message, current_context)
        
        # 3. Handle Context Updates from Phase
        if phase_result.get("data"):
            for k, v in phase_result["data"].items():
                ctx_obj.update(k, v)
        if phase_result.get("next_phase"):
             ctx_obj.update("current_phase", phase_result["next_phase"])
        
        # 4. If Phase provides a deterministic reply, skip LLM (Optimization/Profit)
        if phase_result.get("reply") and not phase_result.get("force_llm"):
             yield phase_result["reply"]
             return

        # 5. Get Specialized Prompt for LLM Fallback
        final_system_instruction = system_instruction or phase_instance.get_prompt(ctx_obj.to_dict())
        
        # Log for Debugging
        print(f" BRAIN ROUTE [{user_id}]: {handler_id} ({confidence:.2f}) -> {phase_instance.phase_id}")
        # --- V2 BRAIN INJECTION END ---

        #  CHOOSE MODEL PROVIDER
        from src.config.model_routing import master_model_router, TaskType, RouteDestination
        route_config = await master_model_router.get_route(TaskType.CORE_CHAT)
        
        # The system instruction is now directly the final_system_instruction,
        # as the Master Gatekeeper interception has been removed.
        enhanced_system_instruction = final_system_instruction
        
        # --- NEW: Phase 12.8 Honest Recall Persona ---
        last_topic_id = ctx_obj.get("last_topic_id")
        if last_topic_id:
            import asyncio
            from src.database.neo4j_client import neo4j_client
            # Check if Topic is a Skeleton
            query = "MATCH (t:Topic {gid: $tid}) RETURN t.details_purged as purged, t.title as title"
            res = await neo4j_client.run(query, tid=last_topic_id)
            if res and res[0].get("purged"):
                topic_title = res[0].get("title", "this topic")
                recall_prefix = f"\n[METABOLISM SYSTEM]: Note to AI: The details of the topic '{topic_title}' have been purged to save space. Be honest with the user. Say: 'Bhai, mujhe yaad hai humne {topic_title} pe baat ki thi, par exact details meri memory se flush ho gayi hain. Kya aap phir se bata sakte hain?' if they ask for details.\n"
                enhanced_system_instruction = recall_prefix + enhanced_system_instruction
        
        if route_config["provider"] == RouteDestination.OLLAMA:
            from src.core.ollama_client import ollama_client
            model_name = route_config["model_name"]
            logger.info(f" Streaming via Ollama ({model_name})")
            
            response = await ollama_client.generate(
                prompt=user_message,
                model=model_name,
                system=enhanced_system_instruction
            )
            yield response["text"]
            return

        model_name = route_config["model_name"]
        print(f" [SpeedMode] Streaming via Gemini {model_name}")
        contents = []
        
        # Add history
        if conversation_history:
            for msg in conversation_history:
                contents.append(types.Content(
                    role=msg.get("role", "user"),
                    parts=[types.Part(text=msg.get("text", ""))]
                ))
        
        # Add user message
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=user_message)]
        ))

        # Config with Specialized System Instruction
        config_params = {
            "temperature": 0.7,
            "system_instruction": enhanced_system_instruction,
            # "tools": [types.Tool(google_search=types.GoogleSearch())] # Disabled for now to speed up local test
        }

        try:
            full_response = ""
            async for chunk in self.generate_content_stream(contents, config_params, model=model_name):
                if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                    continue
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text

            # --- V2: Graph Injection ---
            # After stream finishes, sync the entire turn (User Message + Full AI Response)
            # to the Unified Graph (Topics, Persona, Knowledge)
            sync_result = await graph_orchestrator.sync_interaction_unified(
                user_id=user_id,
                org_id=ctx_obj.get("org_id", "default_org"),
                message=user_message,
                response=full_response,
                reply_to_mongo_id=reply_to_mongo_id,
                previous_topic_id=ctx_obj.get("last_topic_id"),
                psychology_layer=audit.get("psychology_layer"),
                user_role=ctx_obj.get("user_role", "visitor")
            )

            # Update topic state for the next turn
            if sync_result and sync_result.get("topic_id"):
                ctx_obj.update("last_topic_id", sync_result["topic_id"])

        except Exception as e:
            logger.error(f" Chat Service Error: {e}")
            yield "Sorry, I'm having trouble connecting right now."

    async def generate_response(self, user_message: str, user_id: str, conversation_history: list = None, system_instruction: str = None, context: dict = {}) -> dict:
        """Full response wrapper with usage metadata."""
        
        ctx_obj = ContextManager.get_context(user_id)
        if context:
            for k, v in context.items(): ctx_obj.update(k, v)
        current_context = ctx_obj.to_dict()

        system_type, handler_id, confidence, audit = await orchestrator.route(user_message, user_id, current_context)
        worker_instance = orchestrator.get_worker(system_type, handler_id)

        # --- NEW: Employee Flow ---
        if system_type == "employee":
             agent_result = await worker_instance.execute(user_message, current_context)
             return {"text": agent_result["reply"], "usage": {"total_tokens": 0}}

        # --- LEGACY: Phase Flow ---
        # Note: Same logic for syncing non-streaming response
        sync_result = await graph_orchestrator.sync_interaction_unified(
            user_id=user_id,
            org_id=ctx_obj.get("org_id", "default_org"),
            message=user_message,
            response=agent_result["reply"] if system_type == "employee" else "FIXME",
            previous_topic_id=ctx_obj.get("last_topic_id"),
            psychology_layer=audit.get("psychology_layer"),
            user_role=ctx_obj.get("user_role", "visitor")
        )
        if sync_result and sync_result.get("topic_id"):
            ctx_obj.update("last_topic_id", sync_result["topic_id"])

        return {"text": "Success", "usage": {"total_tokens": 0}}
        phase_instance = worker_instance
        
        # 2. Give Specialist a Chance to Execute Logic (Pre-LLM)
        phase_result = await phase_instance.execute(user_message, current_context)
        
        # 3. Handle Context Updates from Phase
        if phase_result.get("data"):
            for k, v in phase_result["data"].items():
                ctx_obj.update(k, v)
        if phase_result.get("next_phase"):
             ctx_obj.update("current_phase", phase_result["next_phase"])
        
        # 4. If Phase provides a deterministic reply, skip LLM
        if phase_result.get("reply") and not phase_result.get("force_llm"):
             return {"text": phase_result["reply"], "usage": {"total_tokens": 0}}

        # 5. Get Specialized Prompt for LLM Fallback (using updated context)
        final_system_instruction = system_instruction or phase_instance.get_prompt(ctx_obj.to_dict())
        print(f" BRAIN ROUTE [{user_id}]: {handler_id} ({confidence:.2f}) -> {phase_instance.phase_id}")
        # --- V2 BRAIN INJECTION END ---
        
        from src.config.model_routing import master_model_router, TaskType, RouteDestination
        route_config = await master_model_router.get_route(TaskType.CORE_CHAT)
        model_name = route_config["model_name"]
        
        if route_config["provider"] == RouteDestination.OLLAMA:
            from src.core.ollama_client import ollama_client
            
            response = await ollama_client.generate(
                prompt=user_message,
                model=model_name,
                system=final_system_instruction
            )
            return {"text": response["text"], "usage": {"total_tokens": 0}}

        contents = []
        
        # Add history
        if conversation_history:
            for msg in conversation_history:
                contents.append(types.Content(
                    role=msg.get("role", "user"),
                    parts=[types.Part(text=msg.get("text", ""))]
                ))
        
        # Add user message
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=user_message)]
        ))

        # Config
        config_params = {
            "temperature": 0.7,
            "system_instruction": final_system_instruction,
            "tools": [types.Tool(google_search=types.GoogleSearch())]
        }

        try:
            response = await self.generate_content(contents, config_params, model=model_name)
            
            usage = {}
            text = ""
            
            # Handle Gemini usage
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = {
                    "input_tokens": response.usage_metadata.prompt_token_count,
                    "output_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count
                }
                text = response.text
            # Handle Groq usage
            elif hasattr(response, 'usage') and response.usage:
                usage = {
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
                text = response.choices[0].message.content
            else:
                text = getattr(response, 'text', str(response))

            return {
                "text": text,
                "usage": usage
            }
        except Exception as e:
            print(f" Chat Service Error: {e}")
            return {
                "text": "Sorry, I'm having trouble connecting right now.",
                "usage": {}
            }

chat_ai_service = ChatAIService()
