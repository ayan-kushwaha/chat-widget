// 🕸️ Cluaiz Neural OS: Master Cypher Schema (V10.3)
// Role: Define Constraints and Skeletal Structure for the 3-Pivot Brain

// ── 1. Constraints (Data Integrity) ──────────────────────────────────────────

CREATE CONSTRAINT org_id_unique IF NOT EXISTS FOR (n:Organization) REQUIRE n.org_id IS UNIQUE;
CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (n:Agent) REQUIRE n.agent_id IS UNIQUE;
CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (n:Skill) REQUIRE n.skill_id IS UNIQUE;
CREATE CONSTRAINT goal_id_unique IF NOT EXISTS FOR (n:Goal) REQUIRE n.goal_id IS UNIQUE;
CREATE CONSTRAINT focus_group_unique IF NOT EXISTS FOR (n:FocusSummary) REQUIRE n.focus_group_id IS UNIQUE;

// ── 2. The 3-Pivot Hubs Foundation ───────────────────────────────────────────

// Root Organization
MERGE (o:Organization {org_id: "system_root"})
SET o.name = "Cluaiz System Root";

// Hubs (Workforce, Cognition, Essence)
MERGE (wf:Hub {name: "AI Workforce Hub", org_id: "system_root"})
MERGE (cg:Hub {name: "Knowledge Cognition", org_id: "system_root"})
MERGE (es:Hub {name: "Essence & Context", org_id: "system_root"});

// ── 3. Relationship Types (The Wiring) ────────────────────────────────────────

// Workforce Branch
// (Agent)-[HAS_SKILL]->(Skill)
// (Skill)-[SUPPORTS_GOAL]->(Goal)
// (Agent)-[HAS_MEMBER]->(AnyNode)

// Cognition Branch
// (Hub)-[HAS_DOCUMENT]->(Document)
// (Document)-[HAS_PAGE]->(Page)
// (Page)-[HAS_CHUNK]->(KnowledgeChunk)
// (KnowledgeChunk)-[RESONATES_WITH]->(Goal)

// Essence Branch
// (Hub)-[HAS_GOAL]->(Goal)
// (Hub)-[HAS_IDENTITY]->(IdentityNode)
// (IdentityNode)-[DEFINES_TONE]->(Agent)

// Focus Mode (The Chain/Dhaga)
// (ChatEpisode)-[NEXT_FOCUS {confidence: 0.9, priority_score: 1.0}]->(ChatEpisode)
// (FocusSummary)-[REPRESENTS]->(ChatEpisode)

// ── 4. Metabolism (Janitor Fields) ───────────────────────────────────────────
// All nodes should include:
// last_accessed: TIMESTAMP
// access_count: INTEGER
// decay_weight: FLOAT (0.0 - 1.0)
