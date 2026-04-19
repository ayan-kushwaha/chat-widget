"""

    GRAPH BUILDER V10.3  Pillar-Aware Neural Extractor       
  Cluaiz Neural OS | services/neural/graph/builder.py             
                                                                  
  Role: Performs Multi-Stage Extraction to align data with the    
        3-Pivot Nervous System (Workforce, Cognition, Essence).   
        Establishes Smart Links to Business Goals.               

"""

import json
import re
from loguru import logger

from src.core.brain import brain
from src.database.neo4j_client import neo4j_client

class GraphBuilderService:
    
    async def extract_and_store(self, yaml_text: str, org_id: str, source_id: str) -> dict:
        """
        Parses YAML text via LLM to extract graph nodes/edges aligned with the 3-Pivot Model.
        """
        if not neo4j_client.enabled:
            logger.warning("  [GraphBuilder] Neo4j is disabled. Skipping extraction.")
            return {"nodes": 0, "edges": 0}

        # Contextual Anchor Prompt (V10.3)
        safe_text = yaml_text[:5000] # Increased context for deeper reasoning

        prompt = f"""
        You are the Lead Digital Architect for the Cluaiz Neural OS. 
        Your mission is to extract a "High-IQ" Knowledge Graph from a document chunk, aligning it with our 3-Pivot Nervous System.

        3-PIVOT PINS (Target Branches):
        1. WORKFORCE: Agents, Skills, Roles, Tasks, Employees.
        2. COGNITION: Facts, Chunks, Files, Website Pages, Technical Data.
        3. ESSENCE: Business Goals, Identity, Rules, Mission, Departments.

        EXTRACTION RULES:
        1. Identify 10-15 core entities. For each, determine its NEURAL PILLAR (Workforce/Cognition/Essence).
        2. SMART LINKING: Search for links to "Business Goals" or "Missions". If a chunk supports a goal, create a SUPPORTS_GOAL link.
        3. ENTITY LABELS: [Agent, Skill, Employee, Goal, Document, Concept, Department, Project].
        4. NAME: Use human-readable Display Names (e.g., "Marketing Goal 2024").

        OUTPUT FORMAT (STRICT JSON ONLY):
        {{
            "entities": [
                {{
                    "id": "skill_python", 
                    "label": "Skill", 
                    "pillar": "Workforce", 
                    "name": "Python Programming", 
                    "description": "Core backend skill"
                }}
            ],
            "relationships": [
                {{
                    "source_id": "skill_python", 
                    "target_id": "goal_automation", 
                    "type": "SUPPORTS_GOAL", 
                    "description": "Python automates backend tasks"
                }}
            ]
        }}

        TEXT TO ANALYZE (Cluaiz Index Data):
        "{safe_text}"
        """

        try:
            logger.info(f" [GraphBuilder] Starting Pillar-Aware Extraction (Org: {org_id})")
            result = await brain.generate(prompt)
            
            response_text = result.get("text", "") if isinstance(result, dict) else str(result)
            if not response_text: raise ValueError("Empty AI Brain response")

            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not match: raise ValueError("Invalid JSON in LLM response")
            
            data = json.loads(match.group(0).strip())
            entities = data.get("entities", [])
            relationships = data.get("relationships", [])
            
            nodes_created = 0
            edges_created = 0

            #  Step 1: Initialize Hubs if missing 
            await self._ensure_hubs(org_id)

            #  Step 2: Spawn Specialized Neurons 
            from src.services.neural.neurons.factory import factory
            
            for ent in entities:
                ent_id = str(ent.get("id")).strip().lower()
                ent_label = str(ent.get("label", "Concept")).strip().capitalize()
                pillar = str(ent.get("pillar", "Cognition")).capitalize()
                
                if not ent_id: continue

                # Specialized Props for DNA Injection
                props = {
                    "name": str(ent.get("name", ent_id))[:100],
                    "description": str(ent.get("description", ""))[:300],
                    "pillar": pillar
                }

                #  Spawn & Sync via Neural DNA Classes
                neuron = factory.spawn(label=ent_label, gid=ent_id, org_id=org_id, **props)
                
                # Check for specialized DNA fields in LLM response (Polymorphism)
                dna_data = {}
                for key, val in ent.items():
                    if key not in ["id", "label", "pillar", "name", "description"]:
                        dna_data[key] = val
                
                # Persistence + Metabolism + Hub Linking
                await neuron.sync_to_neo4j(dna=dna_data)

                nodes_created += 1

            #  Step 3: Merge Relationships 
            for rel in relationships:
                src_id = str(rel.get("source_id")).strip().lower()
                tgt_id = str(rel.get("target_id")).strip().lower()
                rel_type = str(rel.get("type", "CONNECTED_TO")).strip().upper()
                
                if not src_id or not tgt_id: continue

                # We use a broad search for relationships since labels might vary in LLM extraction
                # Or we could fetch labels from our entities map if we stored them
                await neo4j_client.run(
                    f"""
                    MATCH (n {{org_id: $org_id}}) WHERE n.node_id = $src OR n.skill_id = $src OR n.doc_id = $src OR n.agent_id = $src OR n.goal_id = $src
                    MATCH (m {{org_id: $org_id}}) WHERE m.node_id = $tgt OR m.skill_id = $tgt OR m.doc_id = $tgt OR m.agent_id = $tgt OR m.goal_id = $tgt
                    MERGE (n)-[r:{rel_type}]->(m)
                    SET r.description = $desc, r.org_id = $org_id, r.confidence = 0.8
                    """,
                    src=src_id, tgt=tgt_id, desc=str(rel.get("description", "")), org_id=org_id
                )
                edges_created += 1
                
            logger.info(f" [Builder V10.3] Synced {nodes_created} Nodes ({nodes_created} Pillar-Linked) and {edges_created} Edges.")
            return {"nodes": nodes_created, "edges": edges_created}

        except Exception as e:
            logger.error(f" [Builder V10.3] Failed extraction: {e}")
            return {"nodes": 0, "edges": 0}

    def _get_id_key(self, label: str) -> str:
        mapping = {
            "Skill": "skill_id", "Agent": "agent_id", "Goal": "goal_id",
            "Employee": "emp_id", "Person": "emp_id", "Document": "doc_id"
        }
        return mapping.get(label, "node_id")

    async def _ensure_hubs(self, org_id: str):
        hubs = ["AI Workforce Hub", "Knowledge Cognition", "Essence & Context"]
        for name in hubs:
            await neo4j_client.merge_node(
                label="Hub", 
                match_props={"name": name, "org_id": org_id},
                set_props={"description": f"Main {name} branch for org"}
            )
            # Link Hub to Organization Root
            await neo4j_client.merge_relationship(
                from_label="Organization", from_id_key="org_id", from_id_val=org_id,
                to_label="Hub", to_id_key="name", to_id_val=name,
                relation="HAS_PIVOT", props={"org_id": org_id}
            )

builder = GraphBuilderService()
