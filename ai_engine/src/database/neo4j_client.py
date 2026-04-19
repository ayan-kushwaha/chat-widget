"""

    NEO4J CLIENT  Neural Mind Map Database Connection      
  Cluaiz Neural OS | database/neo4j_client.py                 
                                                              
  Role: Single connection point for all Neo4j operations.     
        All neural/ services use THIS client, never          
        create their own driver instances.                    
                                                              
  Protocol: Bolt (binary, fast, persistent)                   
  Port:     7687                                              

"""

import os
from typing import Any, Optional

try:
    from neo4j import AsyncGraphDatabase, AsyncDriver
    from neo4j.exceptions import ServiceUnavailable, AuthError
    HAS_NEO4J = True
except ImportError:
    HAS_NEO4J = False
    AsyncDriver = Any # Fallback for type hinting
    ServiceUnavailable = Exception
    AuthError = Exception

from src.utils.logger import logger


class Neo4jClient:
    """
    Singleton async Neo4j driver.
    All Neural OS services (indexer, mind_map, navigator) share one connection pool.
    """

    _driver: Optional[Any] = None # Use Any to avoid type error if neo4j missing

    def __init__(self):
        self.enabled   = HAS_NEO4J
        self._uri      = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
        self._user     = os.getenv("NEO4J_USER",     "neo4j")
        self._password = os.getenv("NEO4J_PASSWORD", "cluaiz_neural_os")

    #  Lifecycle 

    async def connect(self):
        """Create the driver (called once on app startup)."""
        if not self.enabled:
            logger.warning("[Neo4j] Library 'neo4j' not found. Graph sync will be disabled.")
            return

        if self._driver:
            return  # Already connected

        try:
            self._driver = AsyncGraphDatabase.driver(
                self._uri,
                auth=(self._user, self._password),
                max_connection_pool_size=20,      # Handles concurrent requests
                connection_acquisition_timeout=10.0,
            )
            # Verify connectivity immediately
            try:
                await self._driver.verify_connectivity()
                logger.info("✅ [Neo4j] Connected successfully -> " + self._uri)
            except Exception as e:
                logger.warning(f"⚠️ [Neo4j] Link failed -- is Neo4j running? {e}")
                self.enabled = False
                await self.close()
                return

            # One-time schema constraints (idempotent, safe to call every startup)
            await self._setup_constraints()

        except AuthError as e:
            logger.error(f"❌ [Neo4j] Auth failed -- wrong password? {e}")
            raise
        except ServiceUnavailable as e:
            logger.error(f"❌ [Neo4j] Service unavailable -- is Neo4j container running? {e}")
            raise
        except Exception as e:
            logger.error(f"❌ [Neo4j] Unexpected connection error: {e}")
            raise

    async def close(self):
        """Close the driver (called on app shutdown)."""
        if self._driver:
            await self._driver.close()
            self._driver = None
            logger.info("🔌 [Neo4j] Connection closed.")

    #  Schema Setup (Idempotent) 

    async def _setup_constraints(self):
        """
        Create uniqueness constraints & indexes for the Neural Mind Map.
        Safe to run on every startup  Neo4j ignores if already exists.
        """
        constraints = [
            # Unique node IDs for each type
            "CREATE CONSTRAINT org_id IF NOT EXISTS FOR (o:Org) REQUIRE o.org_id IS UNIQUE",
            "CREATE CONSTRAINT emp_id IF NOT EXISTS FOR (e:Employee) REQUIRE e.emp_id IS UNIQUE",
            "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.skill_id IS UNIQUE",
            "CREATE CONSTRAINT doc_id IF NOT EXISTS FOR (d:Document) REQUIRE d.doc_id IS UNIQUE",
            "CREATE CONSTRAINT session_id IF NOT EXISTS FOR (c:ChatSession) REQUIRE c.session_id IS UNIQUE",
            "CREATE CONSTRAINT psych_gid IF NOT EXISTS FOR (p:PsychologyMap) REQUIRE p.gid IS UNIQUE",
            "CREATE INDEX psych_timestamp IF NOT EXISTS FOR (p:PsychologyMap) ON (p.timestamp)"
        ]
        async with self._driver.session() as session:
            for cypher in constraints:
                try:
                    await session.run(cypher)
                except Exception as e:
                    # Constraint already exists is OK
                    logger.debug(f"[Neo4j] Constraint note: {e}")
        logger.info("✅ [Neo4j] Schema constraints ready.")

    #  Core Operations 

    async def run(self, cypher: str, **params) -> list[dict]:
        """
        Execute a Cypher query and return all records as list of dicts.
        Use for: reads, writes, anything that returns data.
        """
        if not self._driver:
            raise RuntimeError("Neo4j not connected. Call connect() first.")

        async with self._driver.session() as session:
            result = await session.run(cypher, **params)
            records = await result.data()
            return records

    async def run_write(self, cypher: str, **params) -> None:
        """
        Execute a write-only Cypher query (CREATE, MERGE, SET, DELETE).
        Wrapped in explicit write transaction for safety.
        """
        if not self._driver:
            raise RuntimeError("Neo4j not connected. Call connect() first.")

        async with self._driver.session() as session:
            await session.execute_write(lambda tx: tx.run(cypher, **params))

    #  High-Level Helpers (used by neural/ services) 

    async def merge_node(self, label: str, match_props: dict, set_props: dict) -> None:
        """
        MERGE a node by match_props, then SET additional set_props.

        Example:
            merge_node("Employee",
                       match_props={"emp_id": "emp_aman_001"},
                       set_props={"name": "Aman", "role": "Social Media Manager"})
        """
        match_clause = ", ".join(f"{k}: ${k}" for k in match_props)
        set_clause   = ", ".join(f"n.{k} = $set_{k}" for k in set_props)

        cypher = f"""
        MERGE (n:{label} {{{match_clause}}})
        SET {set_clause}
        """
        # Flatten params: match_props keys stay, set_props keys get "set_" prefix
        params = {**match_props, **{f"set_{k}": v for k, v in set_props.items()}}
        await self.run_write(cypher, **params)

    async def merge_relationship(
        self,
        from_label: str, from_id_key: str, from_id_val: str,
        to_label: str,   to_id_key: str,   to_id_val: str,
        relation: str,
        props: Optional[dict] = None,
    ) -> None:
        """
        MERGE a relationship between two existing nodes.

        Example:
            merge_relationship(
                from_label="Employee", from_id_key="emp_id", from_id_val="emp_aman",
                to_label="Skill",     to_id_key="skill_id", to_id_val="skill_yt",
                relation="HAS_SKILL", props={"weight": 0.95}
            )
        """
        props_clause = ""
        if props:
            props_clause = " {" + ", ".join(f"{k}: ${k}" for k in props) + "}"

        cypher = f"""
        MATCH (a:{from_label} {{{from_id_key}: $from_id}})
        MATCH (b:{to_label}   {{{to_id_key}:   $to_id}})
        MERGE (a)-[r:{relation}{props_clause}]->(b)
        """
        params = {"from_id": from_id_val, "to_id": to_id_val, **(props or {})}
        await self.run_write(cypher, **params)

    async def find_nodes(self, label: str, **match_props) -> list[dict]:
        """
        Find and return all nodes of a given label matching props.

        Example:
            find_nodes("Employee", org_id="org_123")
        """
        where_clause = " AND ".join(f"n.{k} = ${k}" for k in match_props)
        cypher = f"MATCH (n:{label}) WHERE {where_clause} RETURN n"
        records = await self.run(cypher, **match_props)
        return [r["n"] for r in records]

    async def node_exists(self, label: str, id_key: str, id_val: str) -> bool:
        """Quick check: does a specific node exist?"""
        result = await self.run(
            f"MATCH (n:{label} {{{id_key}: $id}}) RETURN COUNT(n) AS count",
            id=id_val,
        )
        return result[0]["count"] > 0 if result else False


#  Singleton 

neo4j_client = Neo4jClient()
