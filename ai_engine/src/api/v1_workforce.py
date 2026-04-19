from fastapi import APIRouter, Body
from src.services.workforce.workforce_service import workforce_service
from typing import Dict, Any, List

router = APIRouter()

@router.post("/scan")
async def scan_documents(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to scan company knowledge base.
    Expects: { "user_id": "..." }
    """
    user_id = payload.get("user_id")
    return await workforce_service.scan_documents(user_id)

@router.post("/diagnose")
async def diagnose_knowledge(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to check for critical missing info for a role.
    Expects: { "role": "...", "documents": [...] }
    """
    role = payload.get("role")
    documents = payload.get("documents", [])
    return await workforce_service.diagnose_knowledge(role, documents)

@router.post("/repair")
async def repair_persona(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to polish raw user instructions into a professional persona.
    Expects: { "user_input": "...", "role": "..." }
    """
    user_input = payload.get("user_input")
    role = payload.get("role")
    return await workforce_service.repair_persona(user_input, role)

@router.post("/finalize")
async def finalize_workforce(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to save the final agent configuration.
    Wiring the new Agent directly into the Neo4j Subconscious Engine.
    """
    try:
        from src.services.neural.neurons.factory import factory
        from src.services.neural.graph.synapse_builder import synapse_builder
        from loguru import logger
    except ImportError:
        return {"status": "partial_success", "message": "Deployed (Graph wiring offline due to imports)."}
        
    agent_config = payload.get("agent_config", {})
    org_id = payload.get("org_id", "default_org")
    user_id = payload.get("user_id", "default_user")
    
    # 1. Spawn Identity Nodes (Org & Boss) + Workspace Hubs
    agent_id = agent_config.get("id", "agent_new")
    agent_name = agent_config.get("name", "Unnamed Agent")
    role = agent_config.get("role", "Worker")
    boss_reason = agent_config.get("boss_reason", "Help the company grow.")
    department_name = agent_config.get("department", "General Workforce")
    
    try:
        # A. Identity Extraction & Protection
        user_neuron = factory.spawn("Boss", user_id, org_id, name="Shadow Boss")
        org_neuron = factory.spawn("Org", org_id, org_id, name="Intelligence Center")
        
        await user_neuron.sync_to_neo4j({"role": "Organization Leader"})
        await org_neuron.sync_to_neo4j({"status": "Active Core"})
        
        # Make identities indestructible to prevent Janitor pruning
        if hasattr(user_neuron, "make_indestructible"): await user_neuron.make_indestructible()
        if hasattr(org_neuron, "make_indestructible"): await org_neuron.make_indestructible()
        
        # B. Department Spawning
        dept_id = f"dept_{department_name.lower().replace(' ', '_')}"
        dept_neuron = factory.spawn("Department", dept_id, org_id, name=department_name)
        await dept_neuron.sync_to_neo4j({"status": "Operational"})
        
        # C. Goal/Vision Spawning (Essence Hub)
        import uuid
        goal_id = f"goal_{uuid.uuid4().hex[:6]}"
        goal_neuron = factory.spawn("Goal", goal_id, org_id, name=f"Goal: {role}")
        await goal_neuron.sync_to_neo4j({"mission": boss_reason})

        # D. Spawn the actual Agent Worker
        agent_neuron = factory.spawn("Agent", agent_id, org_id, name=agent_name)
        await agent_neuron.sync_to_neo4j({"role": role, "user_id": user_id, "department": department_name})
        
        #  WIRING THE WORKSPACE ARCHITECTURE (NEURAL_PATHWAYS.yaml) 
        logger.info(f" [Onboarding] Wiring Topological Workspace for {agent_name}...")
        
        # Department -> RECRUITED_FOR -> Agent
        synapse_builder.wire_neurons(source_id=dept_id, source_label="Department", target_id=agent_id, target_label="Agent", org_id=org_id)
        
        # Agent -> REPORTS_TO -> Boss
        synapse_builder.wire_neurons(source_id=agent_id, source_label="Agent", target_id=user_id, target_label="Boss", org_id=org_id)
        
        # Agent -> ALIGNED_TO -> Goal
        synapse_builder.wire_neurons(source_id=agent_id, source_label="Agent", target_id=goal_id, target_label="Goal", org_id=org_id)
        
        # Goal -> GUIDES_MISSION -> Org
        synapse_builder.wire_neurons(source_id=goal_id, source_label="Goal", target_id=org_id, target_label="Org", org_id=org_id)
        
        # 2. Spawn and Connect Skills
        skills = payload.get("skills", agent_config.get("skills", []))
        for skill in skills:
            if isinstance(skill, dict):
                skill_id = skill.get("id", f"skill_{skill.get('name', 'unknown').replace(' ', '_').lower()}")
                skill_name = skill.get("name", "Unknown Skill")
                provider = skill.get("provider", "local")
            else:
                skill_id = str(skill)
                skill_name = str(skill).replace("_", " ").title()
                provider = "local"
            
            # Spawn Skill
            skill_neuron = factory.spawn("Skill", skill_id, org_id, name=skill_name)
            await skill_neuron.sync_to_neo4j({"provider": provider})
            
            # Agent -> HAS_SKILL -> Skill
            synapse_builder.wire_neurons(source_id=agent_id, source_label="Agent", target_id=skill_id, target_label="Skill", org_id=org_id)
            
        logger.info(f" [Workforce] Agent '{agent_name}' fully wired into Neo4j Subconscious Hierarchy.")
        return {"status": "success", "message": f"Agent {agent_name} wired and deployed."}
        
    except Exception as e:
        logger.error(f" [Workforce] Neural Integration failed: {e}")
        return {"status": "partial_success", "message": "Deployed, but neural connection failed.", "error": str(e)}

@router.post("/ritual")
async def run_workforce_ritual(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to run the full 6-step workforce ritual.
    Expects: { "agent_config": { ... } }
    """
    agent_config = payload.get("agent_config", {})
    return await workforce_service.run_full_onboarding(agent_config)

@router.post("/analyze-metadata")
async def analyze_metadata(data: dict = Body(...)):
    """
    Analyze user's metadata to estimate training cost.
    Called by Backend before queuing training job.
    
    Returns: total_tokens, metadata_count for cost calculation
    """
    from fastapi import HTTPException
    from loguru import logger
    
    try:
        from src.services.workforce.metadata_aggregator import metadata_aggregator
        from src.services.workforce.token_estimator import token_estimator
        
        user_id = data.get("user_id")
        agent_id = data.get("agent_id", "generic")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        
        # Fetch metadata
        metadata_list = await metadata_aggregator.fetch_user_metadata(user_id)
        
        if not metadata_list:
            return {
                "total_tokens": 0,
                "metadata_count": 0,
                "warning": "No metadata found for user"
            }
        
        # Aggregate for role
        aggregated = await metadata_aggregator.aggregate_by_role(metadata_list, agent_id)
        
        # Count tokens
        total_tokens = token_estimator.count_tokens(aggregated)
        
        # Check chunking strategy
        chunk_strategy = token_estimator.get_chunk_strategy(total_tokens)
        
        return {
            "total_tokens": total_tokens,
            "metadata_count": len(metadata_list),
            "chunk_strategy": chunk_strategy
        }
        
    except Exception as e:
        logger.error(f"Metadata analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/synthesize")
async def synthesize_constitution(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to synthesize a contextual constitution and mapping.
    Expects: { "dossier": { ... }, "user_id": "..." }
    """
    dossier = payload.get("dossier", {})
    user_id = payload.get("user_id") # Optional fallback
    return await workforce_service.synthesize_constitution(dossier, user_id)

@router.post("/contextualize")
async def contextualize_agent(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint to fine-tune an agent blueprint with Org context and Boss Reason.
    Expects: { "org_context": { ... }, "agent_blueprint": { ... }, "boss_reason": "..." }
    """
    from src.services.workforce.contextualizer import contextualizer
    
    org_context = payload.get("org_context", {})
    agent_blueprint = payload.get("agent_blueprint", {})
    boss_reason = payload.get("boss_reason", "")
    
    return await contextualizer.contextualize(org_context, agent_blueprint, boss_reason)
