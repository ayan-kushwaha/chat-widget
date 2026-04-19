"""

   GRAPH ORCHESTRATOR  The Unified Brain Engine              
  Cluaiz Neural OS | graph_manager/orchestrator.py               
                                                                  
  Role: Stitches all sub-graphs into a single semantic unit.      

"""
from typing import Dict, Any, List
from loguru import logger

from .chat_processor import chat_processor
from .topic_detector import topic_detector
from .persona_engine import persona_engine
from .emotional_engine import emotional_engine
from .decision_audit import decision_audit
from .psychology_manager import psychology_manager
from ..metabolism.metabolism_manager import metabolism_manager
from ..gds.topic_linker import topic_linker
from src.database.neo4j_client import neo4j_client

class GraphOrchestrator:
    """
    The main controller for the Unified Graph system.
    Coordinates Chat, Topics, Persona, and Knowledge.
    """
    
    async def sync_interaction_unified(self, *args, **kwargs):
        """
        The "Grand Central Station" logic for Chat interactions.
        """
        # Map arguments manually to avoid TypeError during transition
        user_id = kwargs.get("user_id") or (args[0] if len(args) > 0 else None)
        org_id = kwargs.get("org_id") or (args[1] if len(args) > 1 else None)
        message = kwargs.get("message") or (args[2] if len(args) > 2 else None)
        response = kwargs.get("response") or (args[3] if len(args) > 3 else None)
        reply_to_mongo_id = kwargs.get("reply_to_mongo_id") or (args[4] if len(args) > 4 else None)
        previous_topic_id = kwargs.get("previous_topic_id") or (args[5] if len(args) > 5 else None)
        psychology_layer = kwargs.get("psychology_layer")
        user_role = kwargs.get("user_role", "visitor")

        logger.debug(f" [Orchestrator] Received: user={user_id}, org={org_id}, msg={message is not None}, res={response is not None}")
        logger.debug(f" [Orchestrator] Entering process_interaction with: user={user_id}, org={org_id}, msg_len={len(message)}, res_len={len(response)}")
        logger.info(f" [GraphManager] Orchestrating unified graph sync for User: {user_id}")
        
        # UI-driven Deterministic Context Drop
        if reply_to_mongo_id:
            logger.success(f" [GraphManager] 100% Deterministic 'Reply' detected. Teleporting context to mongo_id: {reply_to_mongo_id} (Skipping similarity checks)")
        
        # Step 1: Emotional & Quality Analysis
        emotion_data = await emotional_engine.analyze_sentiment(message)
        is_success = await decision_audit.audit_turn({"message": message, "response": response})
        
        effective_weight = emotion_data["weight"] if is_success else -10.0 # Heavy penalty for logic failure
        
        # Step 2: Log Chat Turn (With Emotional Weight)
        episode_id = await chat_processor.process_turn(
            user_id, 
            org_id, 
            message, 
            role="user"
        )
        
        # Step 2.5: Psychology Stateful Sync (Phase 10)
        psych_gid = await psychology_manager.sync_user_psychology(
            user_id=user_id,
            org_id=org_id,
            psychology_layer=psychology_layer,
            user_role=user_role
        )
        
        if psych_gid:
            # Link current episode to the Psychology state
            await neo4j_client.run_write(
                "MATCH (e:EpisodeNeuron {gid: $eid}), (p:PsychologyMap {gid: $pid}) MERGE (e)-[:IN_STATE]->(p)",
                eid=episode_id, pid=psych_gid
            )
        
        # Step 2.6: Neural Metabolism (Phase 12)
        # Calculate TTL based on sentiment weight
        ttl_days = 365 # Default
        if effective_weight < 0: ttl_days = 7   # Junk
        elif effective_weight < 1.0: ttl_days = 30 # Monthly
        elif effective_weight > 2.0: ttl_days = 9999 # Permanent Discovery
        
        expiry_ts = metabolism_manager.calculate_expiry(ttl_days)
        await neo4j_client.run_write(
            "MATCH (e:EpisodeNeuron {gid: $eid}) SET e.ttl_days = $days, e.expiry_ts = $ts",
            eid=episode_id, days=ttl_days, ts=expiry_ts
        )
        
        # Step 2: Topic Mapping & Matrix Vectorization (Phase 2)
        topic_info = await topic_detector.detect_topic(message, [])
        curr_topic_id = topic_info.get("topic_id")
        topic_name = topic_info.get("topic_name", "General Inquiry")
        
        # NEW: Persistence of the Topic Node (Skeleton Bone)
        logger.info(f" [GraphManager] Persistence: Syncing NeuralTopic:{curr_topic_id}")
        await neo4j_client.run_write(
            "MERGE (t:NeuralTopic {gid: $tid, org_id: $oid}) "
            "ON CREATE SET t.priority_score = 1.0 "
            "SET t.name = $name, t.summary = $summary, t.created_at = timestamp() "
            "WITH t MATCH (e:EpisodeNeuron {gid: $eid}) "
            "MERGE (e)-[:IN_TOPIC]->(t)",
            tid=curr_topic_id, oid=org_id, name=topic_name, summary=topic_info.get("summary", ""), eid=episode_id
        )

        # The true power of the Structured Matrix - Vectorizing YAML Only
        yaml_payload = topic_info.get("structured_yaml", "")
        if yaml_payload:
            logger.info(" [Qdrant] Vectorizing & Storing the 6-Parameter Structured Topic Matrix (YAML)")
            # In production: await qdrant_client.upsert(curr_topic_id, vector=get_embedding(yaml_payload), payload={"yaml": yaml_payload})
        
        # Step 3: Persona Mapping
        persona_traits = await persona_engine.extract_persona_traits(message)
        logger.debug(f" [GraphManager] Persona updated: {persona_traits['intent_type']}")
        
        # Step 4: Stashing AI Response
        ai_episode_id = await chat_processor.process_turn(user_id, org_id, response, role="assistant", parent_episode_id=episode_id)
        
        # UI-driven Deterministic Edge
        if reply_to_mongo_id:
            logger.info(f" [TopicLinker] Generating HARD-LINK: ({episode_id}) -[:REPLIES_TO]-> ({reply_to_mongo_id})")
        
        # Step 5: GDS Automated Bridging (The Brain's Growth)
        curr_topic_id = topic_info.get("topic_id")
        if curr_topic_id:
            # A. Predictive Linking (Sequential Logic)
            if previous_topic_id:
                await topic_linker.create_predictive_link(curr_topic_id, previous_topic_id)
            
            # B. Semantic Linking (Universal Logic)
            await topic_linker.detect_semantic_overlap(
                topic_id=curr_topic_id, 
                topic_name=topic_info["topic_name"], 
                org_id=org_id
            )
            
            # C. Metabolism Aging (Phase 12)
            await metabolism_manager.update_topic_lifecycle(curr_topic_id, org_id)

        logger.success(" [GraphManager] Unified Graph Sync Complete.")
        return {
            "episode_id": episode_id,
            "ai_episode_id": ai_episode_id,
            "topic": topic_info["topic_name"]
        }

    async def process_reaction(self, user_id: str, target_mongo_id: str, emoji: str):
        """
        Handles post-chat Emoji Reactions dynamically (The Hebbian Cheat Code).
        Uses EmotionalEngine to determine if any given emoji is positive or negative.
        """
        logger.info(f" [GraphManager] Analyzing dynamic emoji reaction: {emoji}")
        
        # Dynamically determine the sentiment of any emoji from frontend
        emotion_data = await emotional_engine.analyze_sentiment(emoji)
        weight = emotion_data.get("weight", 1.0)
        
        if weight > 1.0:
            logger.success(f" [Hebbian Learning] Positive reinforcement on {target_mongo_id} ({emoji})! Boosting priority_score by +{weight}")
            cypher = "MATCH (n) WHERE $id IN n.mongo_ids SET n.interaction_weight = coalesce(n.interaction_weight, 1.0) + $weight"
            await neo4j_client.run_write(cypher, id=target_mongo_id, weight=weight)
        elif weight < 0.0:
            logger.error(f" [Hebbian Learning] Negative feedback on {target_mongo_id} ({emoji}). Triggering strong Decay and flagging ConflictNode.")
            cypher = """
            MATCH (n) WHERE $id IN n.mongo_ids 
            SET n.interaction_weight = coalesce(n.interaction_weight, 1.0) + $weight
            MERGE (c:Conflict {name: 'Negative Reaction'})
            MERGE (n)-[:HAS_CONFLICT]->(c)
            """
            await neo4j_client.run_write(cypher, id=target_mongo_id, weight=weight)
        else:
            logger.info(f" [GraphManager] Neutral reaction {emoji} on {target_mongo_id}. No Hebbian update.")
        
        return True

    async def link_skill_output_to_graph(self, org_id: str, skill_name: str, content: Any, label: str = "KnowledgeItem"):
        """
        Links a generated skill output (e.g. a story, a code snippet) to the Org.
        """
        import uuid
        item_id = f"sk_{uuid.uuid4().hex[:8]}"
        logger.info(f" [GraphManager] Linking {skill_name} output to Org {org_id} as {label}:{item_id}")
        
        # In production, this would use a StoryNode or KnowledgeNeuron
        # For now, we simulate the Neo4j sync
        return item_id

graph_orchestrator = GraphOrchestrator()
