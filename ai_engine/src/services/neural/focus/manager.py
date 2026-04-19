"""

    FOCUS MODE MANAGER  Neural Chaining & Attention Lock     
  Cluaiz Neural OS | services/neural/focus/manager.py             
                                                                  
  Role: Manage Conversation 'Dhagas' (Chains) in Neo4j.           
        Enforce Topic Focus vs Branching (0.6 Threshold).         

"""

import time
import re
from loguru import logger
from src.database.neo4j_client import neo4j_client
from src.core.brain import brain
from src.services.neural.neurons.factory import factory

class FocusModeManager:
    
    async def process_message(self, message: str, user_id: str, org_id: str):
        """
        Locks the message into a Focus Chain (Dhaga) or branches into a new one.
        Uses specialized FocusSummaryNode and EpisodeNeuron DNA.
        """
        # 1. Get current active focus
        active_focus_data = await self._get_active_focus(user_id, org_id)
        
        #  Create the Episode Neuron (Input)
        episode_id = f"ep_{int(time.time())}"
        episode = factory.spawn(
            label="Episode", 
            gid=episode_id, 
            org_id=org_id, 
            name="Chat Episode",
            description=message[:100],
            pillar="Memory"
        )
        await episode.sync_to_neo4j(dna={"raw_text": message, "timestamp": time.time()})

        if not active_focus_data:
            return await self._spawn_new_focus(episode, user_id, org_id)

        # 2. Semantic Focus Check (The 0.6 Threshold)
        similarity = await self._check_similarity(message, active_focus_data["summary"])
        logger.info(f" [FocusMode] Dhaga Similarity: {similarity:.2f}")

        if similarity >= 0.6:
            #  STAY: Reinforce existing Dhaga
            await self._extend_chain(episode, active_focus_data["id"], org_id)
            return active_focus_data["id"]
        else:
            #  BRANCH: Create new Dhaga
            return await self._branch_focus(episode, active_focus_data["id"], user_id, org_id)

    async def _get_active_focus(self, user_id: str, org_id: str):
        cypher = """
        MATCH (u:User {user_id: $uid})-[:IN_FOCUS]->(f:FocusSummary {active: true, org_id: $oid})
        RETURN f.focus_id as id, f.name as summary
        LIMIT 1
        """
        res = await neo4j_client.run(cypher, uid=user_id, oid=org_id)
        return res[0] if res else None

    async def _check_similarity(self, message: str, summary: str) -> float:
        # 0.8b Brain performs semantic comparison
        prompt = f"How related is '{message}' to the current topic '{summary}'? Return only a score 0-1."
        res = await brain.generate(prompt)
        text = str(res.get("text", "0.5"))
        try:
            # Extract number
            match = re.search(r'\d+\.\d+', text)
            if not match: match = re.search(r'\d+', text)
            return float(match.group(0)) if match else 0.5
        except:
            return 0.5

    async def _extend_chain(self, episode_neuron, focus_id: str, org_id: str):
        """Reinforces the 'Dhaga' and links the new episode."""
        #  Spawn the Summary Neuron to 'Touch' it (Hebbian)
        focus_summary = factory.spawn(label="FocusSummary", gid=focus_id, org_id=org_id, pillar="Memory")
        focus_summary.touch() # +0.05 weighting
        await focus_summary.sync_to_neo4j()

        # Link Episode -> Focus
        await neo4j_client.merge_relationship(
            from_label="Episode", from_id_key="episode_id", from_id_val=episode_neuron.gid,
            to_label="FocusSummary", to_id_key="focus_id", to_id_val=focus_id,
            relation="BELONGS_TO_CHAIN", props={"org_id": org_id, "weight": 1.0}
        )
        logger.info(f" [FocusMode] Episode {episode_neuron.gid} locked into Dhaga {focus_id}")

    async def _spawn_new_focus(self, episode_neuron, user_id: str, org_id: str):
        focus_id = f"focus_{int(time.time())}"
        
        #  Spawn New FocusSummaryNode
        focus_summary = factory.spawn(
            label="FocusSummary", 
            gid=focus_id, 
            org_id=org_id, 
            name=f"Topic: {episode_neuron.description[:50]}",
            pillar="Memory"
        )
        await focus_summary.sync_to_neo4j(dna={"active": True})

        # Link User -> Focus
        await neo4j_client.merge_relationship(
            from_label="User", from_id_key="user_id", from_id_val=user_id,
            to_label="FocusSummary", to_id_key="focus_id", to_id_val=focus_id,
            relation="IN_FOCUS", props={"org_id": org_id}
        )
        
        # Link Episode -> Focus
        await self._extend_chain(episode_neuron, focus_id, org_id)
        return focus_id

    async def _branch_focus(self, episode_neuron, old_focus_id: str, user_id: str, org_id: str):
        """Deactivates old chain and starts a new one."""
        await neo4j_client.run(
            "MATCH (f:FocusSummary {focus_id: $fid}) SET f.active = false",
            fid=old_focus_id
        )
        logger.info(f" [FocusMode] Branched from {old_focus_id} to new topic.")
        return await self._spawn_new_focus(episode_neuron, user_id, org_id)

focus_manager = FocusModeManager()
