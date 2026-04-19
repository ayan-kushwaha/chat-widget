"""

    AGENT LINKER  Workforce Integration for Neural OS       
  Cluaiz Neural OS | services/neural/graph/agent_linker.py        
                                                                  
  Role: Bridges hired Agents, their Skills, and Persona DNA       
        into the Neo4j Brain. Sets up the Workforce Branch.       

"""

from loguru import logger
from src.database.neo4j_client import neo4j_client

class AgentLinkerService:
    
    async def link_hired_agent(self, agent_data: dict, org_id: str):
        """
        Links a newly hired agent, its skills, and goals to the Workforce Hub.
        agent_data: { agent_id, name, persona, skills: [...], goals: [...] }
        """
        agent_id = str(agent_data.get("agent_id")).strip().lower()
        if not agent_id: return

            #  Step 1: Spawn Agent Neuron 
            from src.services.neural.neurons.factory import factory
            
            agent_neuron = factory.spawn(
                label="Agent", 
                gid=agent_id, 
                org_id=org_id, 
                name=agent_data.get("name"),
                description=agent_data.get("persona", ""),
                pillar="Workforce"
            )
            
            # Sync Agent DNA (Persona)
            await agent_neuron.sync_to_neo4j(dna={"persona_alignment": agent_data.get("persona", "")})

            #  Step 2: Spawn & Link Skills 
            from src.services.neural.neurons.workforce.blueprints import get_blueprint
            
            for skill_name in agent_data.get("skills", []):
                skill_id = str(skill_name.strip().lower()).replace(" ", "_")
                skill_neuron = factory.spawn(
                    label="Skill", 
                    gid=skill_id, 
                    org_id=org_id, 
                    name=skill_name.capitalize(),
                    pillar="Workforce"
                )
                
                # Fetch Blueprint DNA
                blueprint = get_blueprint(skill_id)
                
                # Persistence + Metabolism + Blueprint DNA Injection
                await skill_neuron.sync_to_neo4j(dna=blueprint)
                
                # Link Agent -> Skill (Execution Path)
                await neo4j_client.merge_relationship(
                    from_label="Agent", from_id_key="agent_id", from_id_val=agent_id,
                    to_label="Skill", to_id_key="skill_id", to_id_val=skill_id,
                    relation="HAS_SKILL", props={"org_id": org_id, "mastery_level": 1.0}
                )

            #  Step 3: Link to Business Goals (Essence) 
            for goal_name in agent_data.get("goals", []):
                goal_id = str(goal_name.strip().lower())
                # Goals are Essence/Boss neurons
                goal_neuron = factory.spawn(
                    label="Boss", # Goals are boss-level directives
                    gid=goal_id, 
                    org_id=org_id, 
                    name=goal_name.capitalize(),
                    pillar="Essence"
                )
                await goal_neuron.sync_to_neo4j()
                
                await neo4j_client.merge_relationship(
                    from_label="Agent", from_id_key="agent_id", from_id_val=agent_id,
                    to_label="Boss", to_id_key="node_id", to_id_val=goal_id,
                    relation="SUPPORTS_GOAL", props={"org_id": org_id}
                )

            logger.info(f" [AgentLinker V10.7] Successfully synchronized Agent {agent_id} with Neural OS DNA.")
            
        except Exception as e:
            logger.error(f" [AgentLinker] Failed linking agent {agent_id}: {e}")

agent_linker = AgentLinkerService()
