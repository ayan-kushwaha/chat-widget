"""

    NEURAL MIND MAP  Living Knowledge Graph                    
  Cluaiz Neural OS | services/neural/mind_map.py                  
                                                                  
  Role: All create/read/update operations on the Neo4j graph.     
        Builds 4-Layer Neural Map:                                
          Layer 1: Core Identity (Org / Boss DNA)                 
          Layer 2: Employee Skill-Graph                           
          Layer 3: Communication & Task-Flow Map                  
          Layer 4: Episodic Memory (Chat sessions)                
                                                                  
  Called by:                                                      
     indexer.py      (on document upload)                        
     workforce hire  (on employee hire)                          
     chat pipeline   (on session end  summary stored)           

"""

from datetime import datetime, timezone
from typing import Optional

from loguru import logger

from src.database.neo4j_client import neo4j_client


class NeuralMindMap:
    """
    High-level API for the Neural Mind Map.
    Every method maps to a specific graph mutation or traversal.
    """

    #  LAYER 1  Org / Boss Identity 

    async def ensure_org(self, org_id: str, org_name: str = "", industry: str = "") -> None:
        """
        Make sure an Org root node exists.
        Called automatically on first employee hire or document upload.

        Graph:  (:Org {org_id, name, industry, created_at})
        """
        await neo4j_client.merge_node(
            label="Org",
            match_props={"org_id": org_id},
            set_props={
                "name":       org_name or f"Org_{org_id[:6]}",
                "industry":   industry,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        logger.debug(f"[MindMap] Org node ensured: {org_id}")

    #  LAYER 2  Employee Skill-Graph 

    async def create_employee_node(
        self,
        emp_id:     str,
        org_id:     str,
        name:       str,
        role:       str,
        hired_for:  str,
        skills:     list[dict],     # [{skill_id, title, trigger_phrases, confidence}]
        reports_to: Optional[str] = None,
    ) -> None:
        """
        Create an Employee node + all their Skill nodes + relationships.

        Graph structure created:
            (:Org)       -[:HAS_EMPLOYEE]  (:Employee)
            (:Employee)  -[:HAS_SKILL]     (:Skill)
            (:Employee)  -[:REPORTS_TO]    (:Employee) [if reports_to given]

        Args:
            emp_id:     Unique employee ID (from MongoDB)
            org_id:     Owning org
            name:       Display name (e.g. "Aman")
            role:       Role string (e.g. "Social Media Manager")
            hired_for:  The onboarding goal (e.g. "grow YouTube to 10k")
            skills:     List of skill dicts from employee blueprint
            reports_to: emp_id of the boss employee (optional)
        """
        now = datetime.now(timezone.utc).isoformat()

        # Ensure Org root exists
        await self.ensure_org(org_id)

        # Create Employee node
        await neo4j_client.merge_node(
            label="Employee",
            match_props={"emp_id": emp_id},
            set_props={
                "name":            name,
                "role":            role,
                "org_id":          org_id,
                "hired_for":       hired_for,
                "created_at":      now,
                "last_active":     now,
                "confidence":      1.0,   # Starts perfect, decays if unused
                "decay_rate":      0.0,   # Janitor will set per-employee
                "is_golden_vault": False,
            },
        )

        # Link Org  Employee
        await neo4j_client.merge_relationship(
            from_label="Org",      from_id_key="org_id", from_id_val=org_id,
            to_label="Employee",   to_id_key="emp_id",   to_id_val=emp_id,
            relation="HAS_EMPLOYEE",
            props={"hired_at": now},
        )

        # Reporting line (optional)
        if reports_to:
            await neo4j_client.merge_relationship(
                from_label="Employee", from_id_key="emp_id", from_id_val=emp_id,
                to_label="Employee",   to_id_key="emp_id",   to_id_val=reports_to,
                relation="REPORTS_TO",
                props={"since": now},
            )

        # Create Skill nodes + link to Employee
        for skill in skills:
            await self._create_skill_node(emp_id, skill, org_id, now)

        logger.info(
            f" [MindMap] Employee '{name}' added with {len(skills)} skills "
            f" Org '{org_id}'"
        )

    async def _create_skill_node(
        self, emp_id: str, skill: dict, org_id: str, now: str
    ) -> None:
        """Create a Skill node and link it to its Employee."""
        skill_id = skill.get("skill_id") or skill.get("id", "")
        if not skill_id:
            return

        await neo4j_client.merge_node(
            label="Skill",
            match_props={"skill_id": skill_id},
            set_props={
                "title":           skill.get("title", skill_id),
                "org_id":          org_id,
                "trigger_phrases": str(skill.get("trigger_phrases", [])),
                "confidence":      skill.get("confidence", 0.8),
                "created_at":      now,
            },
        )

        await neo4j_client.merge_relationship(
            from_label="Employee", from_id_key="emp_id",   from_id_val=emp_id,
            to_label="Skill",      to_id_key="skill_id",   to_id_val=skill_id,
            relation="HAS_SKILL",
            props={"weight": skill.get("confidence", 0.8)},
        )

        # Skill dependencies (e.g. thumbnail depends_on yt_research)
        for dep_id in skill.get("depends_on", []):
            await neo4j_client.merge_relationship(
                from_label="Skill", from_id_key="skill_id", from_id_val=skill_id,
                to_label="Skill",   to_id_key="skill_id",   to_id_val=dep_id,
                relation="DEPENDS_ON",
            )

    #  LAYER 3  Task-Flow / Communication Map 

    async def record_task_handover(
        self,
        from_emp_id: str,
        to_emp_id: str,
        task_type: str,
        org_id: str,
    ) -> None:
        """
        Record that employee A handed a task to employee B.
        Builds the communication flow layer over time.

        Graph:  (:Employee)-[:HANDED_TO {task_type, count}]->(:Employee)
        """
        try:
            # MERGE with counter increment (APOC not required)
            cypher = """
            MATCH (a:Employee {emp_id: $from_id})
            MATCH (b:Employee {emp_id: $to_id})
            MERGE (a)-[r:HANDED_TO {task_type: $task_type}]->(b)
            ON CREATE SET r.count = 1, r.first_at = $now
            ON MATCH  SET r.count = r.count + 1, r.last_at = $now
            """
            await neo4j_client.run_write(
                cypher,
                from_id=from_emp_id,
                to_id=to_emp_id,
                task_type=task_type,
                now=datetime.now(timezone.utc).isoformat(),
            )
            logger.debug(f"[MindMap] Handover recorded: {from_emp_id}  {to_emp_id}")
        except Exception as e:
            logger.warning(f"  [MindMap] Handover record failed (non-fatal): {e}")

    #  LAYER 4  Episodic Memory (Chat Sessions) 

    async def store_session_node(
        self,
        session_id: str,
        org_id:     str,
        emp_id:     str,
        summary:    str,
        mood:       str = "neutral",
        decay_rate: float = 0.05,
    ) -> None:
        """
        Store a chat session summary as a node in the memory graph.
        Called by brain_janitor.py after compressing raw chats.

        Graph:  (:Employee)-[:HAD_SESSION]->(:ChatSession)
        """
        now = datetime.now(timezone.utc).isoformat()

        await neo4j_client.merge_node(
            label="ChatSession",
            match_props={"session_id": session_id},
            set_props={
                "org_id":    org_id,
                "emp_id":    emp_id,
                "summary":   summary[:500],   # Cap at 500 chars
                "mood":      mood,
                "created_at": now,
                "confidence": 0.9,
                "decay_rate": decay_rate,
                "is_golden_vault": False,
            },
        )

        await neo4j_client.merge_relationship(
            from_label="Employee",    from_id_key="emp_id",     from_id_val=emp_id,
            to_label="ChatSession",   to_id_key="session_id",   to_id_val=session_id,
            relation="HAD_SESSION",
            props={"at": now},
        )
        logger.debug(f"[MindMap] Session node stored: {session_id}")

    #  Graph Queries (used by Shadow Boss Navigator) 

    async def find_employees_for_intent(
        self, org_id: str, intent_keywords: list[str]
    ) -> list[dict]:
        """
        Find best-fit employees for a given intent by traversing
        Employee  Skill nodes and matching trigger_phrases.

        Returns ranked list: [{emp_id, name, role, matched_skill, score}]
        """
        if not intent_keywords:
            return []

        # Build a fuzzy match against skill trigger phrases
        # (simple CONTAINS for now; can upgrade to vector search on skills later)
        keyword_conditions = " OR ".join(
            f"toLower(s.trigger_phrases) CONTAINS '{kw.lower()}'"
            for kw in intent_keywords[:5]
        )

        cypher = f"""
        MATCH (o:Org {{org_id: $org_id}})-[:HAS_EMPLOYEE]->(e:Employee)
        MATCH (e)-[:HAS_SKILL]->(s:Skill)
        WHERE {keyword_conditions}
        RETURN e.emp_id   AS emp_id,
               e.name     AS name,
               e.role     AS role,
               s.skill_id AS matched_skill,
               s.title    AS skill_title,
               s.confidence AS score
        ORDER BY score DESC
        LIMIT 5
        """
        results = await neo4j_client.run(cypher, org_id=org_id)
        return results

    async def get_employee_skills(self, emp_id: str) -> list[dict]:
        """Return all skills of a given employee."""
        cypher = """
        MATCH (e:Employee {emp_id: $emp_id})-[:HAS_SKILL]->(s:Skill)
        RETURN s.skill_id AS skill_id, s.title AS title,
               s.trigger_phrases AS trigger_phrases,
               s.confidence AS confidence
        ORDER BY s.confidence DESC
        """
        return await neo4j_client.run(cypher, emp_id=emp_id)

    async def get_org_documents(self, org_id: str) -> list[dict]:
        """Return all document nodes for an org."""
        cypher = """
        MATCH (o:Org {org_id: $org_id})-[:HAS_DOCUMENT]->(d:Document)
        RETURN d.doc_id AS doc_id, d.filename AS filename,
               d.confidence AS confidence, d.node_count AS node_count
        ORDER BY d.indexed_at DESC
        """
        return await neo4j_client.run(cypher, org_id=org_id)

    async def get_full_org_graph(self, org_id: str) -> list[dict]:
        """
        Return everything connected to an Org  for debugging / visualization.
        Useful for Neo4j Browser visual exploration.
        """
        cypher = """
        MATCH path = (o:Org {org_id: $org_id})-[*1..3]-(n)
        RETURN path
        LIMIT 100
        """
        return await neo4j_client.run(cypher, org_id=org_id)


#  Singleton 

neural_mind_map = NeuralMindMap()
