"""

    GRAPH API  Hybrid Neo4j + MongoDB Neural Map              
  Cluaiz Neural OS | api/v1_graph.py                              
                                                                  
  Role: Fetches Neural Mind Map data from:                        
    1. Neo4j (LLM-extracted entities & relationships)             
    2. MongoDB (PageIndex documents as fallback/supplement)       
         knowledgedocuments, sites                               
  Returns { nodes: [...], links: [...] } for the Graph UI.        

"""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from loguru import logger

from src.database.neo4j_client import neo4j_client
from src.database.mongo import db as mongo_db

router = APIRouter()


#  Helper: Parse a Neo4j Node object into a dict 
def _parse_neo4j_node(node_dict: dict, label: str, n_eid: str) -> dict | None:
    if not node_dict:
        return None
    
    props = node_dict
    
    # Establish Semantic ID mapping so it bridges seamlessly with Mongo's logical lattice
    semantic_id = (
        props.get("org_id") if label in ["Org", "Organization"] else
        props.get("node_id") or props.get("agent_id") or props.get("skill_id") or props.get("dept_id") or props.get("user_id") or props.get("goal_id") or props.get("doc_id") or props.get("emp_id") or n_eid
    )
    
    if label in ["Org", "Organization"] and semantic_id:
        semantic_id = f"org_{semantic_id}" # Maps exactly to Mongo dimension's fake pivot id

    # Priority based display name 
    name = (
        props.get("name")
        or props.get("title")
        or props.get("filename")
        or props.get("role")
        or (props.get("description") or "")[:30] # Use short description if name missing
        or semantic_id
    )
    return {"id": semantic_id, "label": label, "name": name, "properties": props}


@router.get("/{org_id}")
async def get_neural_graph(org_id: str):
    """
    Hybrid graph endpoint:
      1. Pull entities + relationships from Neo4j
      2. Pull all indexed documents from MongoDB (knowledgedocuments, sites)
      3. Merge  any MongoDB doc not already in Neo4j gets added as a Document node
      4. Return unified graph
    """
    logger.info(f" [Graph API] Fetching Hybrid Neural Graph for Org: {org_id}")

    nodes_map: dict[str, dict] = {}
    links_list: list[dict] = []
    links_seen: set[str] = set()

    # 
    # STEP 1: Neo4j Data (if available)
    # 
    if neo4j_client.enabled:
        try:
            # Use stable elementId() to prevent mapping issues, but retrieve semantic labels to inject identity colors
            cypher = """
            MATCH (n {org_id: $org_id})
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN 
                elementId(n) as n_eid, labels(n)[0] as n_label, n,
                elementId(m) as m_eid, labels(m)[0] as m_label, m,
                elementId(r) as r_eid, type(r) as r_type, r
            LIMIT 5000
            """
            records = await neo4j_client.run(cypher, org_id=org_id)

            for record in records:
                n_eid = record.get("n_eid")
                n_label = record.get("n_label", "Concept")
                n_obj = record.get("n")
                m_eid = record.get("m_eid")
                m_label = record.get("m_label", "Concept")
                m_obj = record.get("m")
                r_eid = record.get("r_eid")
                r_type = record.get("r_type", "CONNECTED_TO")
                r_obj = record.get("r")

                p_n_id = None
                p_m_id = None

                if n_eid and n_obj:
                    p_n = _parse_neo4j_node(n_obj, n_label, n_eid)
                    if p_n:
                        p_n_id = p_n["id"]
                        nodes_map[p_n_id] = p_n
                
                if m_eid and m_obj:
                    p_m = _parse_neo4j_node(m_obj, m_label, m_eid)
                    if p_m:
                        p_m_id = p_m["id"]
                        nodes_map[p_m_id] = p_m

                if r_eid and r_obj and p_n_id and p_m_id:
                    if r_eid not in links_seen:
                        links_seen.add(r_eid)
                        links_list.append({
                            "source": p_n_id,
                            "target": p_m_id,
                            "type": r_type,
                            "properties": r_obj
                        })

            logger.info(f"    Neo4j returned {len(nodes_map)} nodes, {len(links_list)} links")
        except Exception as e:
            logger.warning(f" Neo4j query failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
    else:
        logger.info("    Neo4j disabled")

    # 
    # STEP 2: MongoDB PageIndex Documents
    # 
    mongo_doc_nodes = []
    try:
        if not mongo_db.client:
            mongo_db.connect()

        db = mongo_db.client.cluaiz

        # Build org_id query (handle both string and ObjectId)
        org_query = {}
        try:
            if len(str(org_id)) == 24:
                org_query["$or"] = [{"orgId": org_id}, {"orgId": ObjectId(org_id)}]
            else:
                org_query["orgId"] = org_id
        except:
            org_query["orgId"] = org_id

        # 2a. Knowledge Documents (PDFs, uploaded files)
        projection = {
            "filename": 1, "originalName": 1, "name": 1, "title": 1,
            "page_index_meta": 1, "createdAt": 1, "fileType": 1,
            "status": 1
        }
        async for doc in db.knowledgedocuments.find(org_query, projection):
            doc_id_str = str(doc["_id"])
            display_name = (
                doc.get("originalName")
                or doc.get("filename")
                or doc.get("name")
                or doc.get("title")
                or doc_id_str
            )
            meta = doc.get("page_index_meta", {})
            mongo_doc_nodes.append({
                "id": f"doc_{doc_id_str}",
                "label": "Document",
                "name": display_name,
                "properties": {
                    "description": f"Indexed document  {meta.get('node_count', '?')} sections  confidence: {meta.get('confidence', '?')}",
                    "fileType": doc.get("fileType", ""),
                    "node_count": meta.get("node_count", 0),
                    "confidence": meta.get("confidence", 0),
                    "source": "knowledgedocuments",
                    "mongo_id": doc_id_str,
                },
            })

        # 2b. Sites (Website crawls)
        site_projection = {
            "url": 1, "name": 1, "title": 1, "status": 1,
            "pages": {"$slice": 50},  # Limit pages
            "createdAt": 1,
        }
        async for site in db.sites.find(org_query, site_projection):
            site_id_str = str(site["_id"])
            site_name = site.get("name") or site.get("title") or site.get("url") or site_id_str

            # Site as a parent node
            mongo_doc_nodes.append({
                "id": f"site_{site_id_str}",
                "label": "Tool",
                "name": f" {site_name}",
                "properties": {
                    "description": f"Website source: {site.get('url', '')}",
                    "source": "sites",
                    "mongo_id": site_id_str,
                },
            })

            # Each site page as a Document node linked to the site
            for page in site.get("pages", []):
                page_url = page.get("url", "")
                page_id = f"page_{site_id_str}_{hash(page_url) % 100000}"
                page_name = page.get("title") or page_url.split("/")[-1] or page_url
                mongo_doc_nodes.append({
                    "id": page_id,
                    "label": "Document",
                    "name": page_name,
                    "properties": {
                        "description": f"Page: {page_url}",
                        "url": page_url,
                        "source": "site_page",
                        "parent_site": site_id_str,
                    },
                })
                # Link: Site  Page
                link_key = f"site_{site_id_str}{page_id}"
                if link_key not in links_seen:
                    links_seen.add(link_key)
                    links_list.append({
                        "source": f"site_{site_id_str}",
                        "target": page_id,
                        "type": "HAS_PAGE",
                    })

        # 2c. Manual Documents (RESTORED)
        async for doc in db.manualdocuments.find(org_query, {"title": 1, "name": 1, "createdAt": 1, "page_index_meta": 1}):
            doc_id_str = str(doc["_id"])
            name = doc.get("title") or doc.get("name") or doc_id_str
            meta = doc.get("page_index_meta", {})
            mongo_doc_nodes.append({
                "id": f"manual_{doc_id_str}",
                "label": "Document",
                "name": name,
                "properties": {
                    "description": f"Manual document  {meta.get('node_count', '?')} sections",
                    "source": "manualdocuments",
                    "mongo_id": doc_id_str,
                },
            })

        logger.info(f"    MongoDB returned {len(mongo_doc_nodes)} document nodes")

    except Exception as e:
        logger.warning(f" MongoDB query failed: {e}")

    # 
    # STEP 3: 3-Pivot Neural Model (V10)  Structure the Brain
    # 
    org_node_id = f"org_{org_id}"
    wf_node_id = f"workforce_{org_id}"
    cg_node_id = f"cognition_{org_id}"
    es_node_id = f"essence_{org_id}"

    if mongo_doc_nodes or nodes_map:
        # Create Org Root
        if org_node_id not in nodes_map:
            nodes_map[org_node_id] = {
                "id": org_node_id,
                "label": "Organization",
                "name": "My Intelligence Center",
                "properties": {"description": "Central Neural Root"},
            }

        # Inject 3 Pillars
        pivot_data = [
            (wf_node_id, " AI Workforce Hub", "Operational Intelligence", "1_WORKFORCE"),
            (cg_node_id, " Knowledge Cognition", "Stored Intelligence", "2_COGNITION"),
            (es_node_id, " Essence & Context", "Structural Intelligence", "3_ESSENCE"),
        ]
        for pid, name, desc, rel in pivot_data:
            if pid not in nodes_map:
                nodes_map[pid] = {
                    "id": pid,
                    "label": "Hub",
                    "name": name,
                    "properties": {"description": desc},
                }
                links_list.append({"source": org_node_id, "target": pid, "type": rel})

    # 3b. Categorize data into Pivots
    # Collect existing doc names to avoid duplicates
    existing_names = {n.get("name", "").lower() for n in nodes_map.values() if n["label"] == "Document"}

    for mnode in mongo_doc_nodes:
        if mnode["name"].lower() in existing_names or mnode["id"] in nodes_map:
            continue
        nodes_map[mnode["id"]] = mnode

        # Link to Cognition
        if mnode["label"] in ("Document", "Tool") and "parent_site" not in mnode.get("properties", {}):
            rel = "HAS_SITE" if mnode["label"] == "Tool" else "HAS_DOCUMENT"
            links_list.append({"source": cg_node_id, "target": mnode["id"], "type": rel})

    # 3c. Final Orphan Roundup
    for nid, node in list(nodes_map.items()):
        if nid in (org_node_id, wf_node_id, cg_node_id, es_node_id): continue
        incoming = [l for l in links_list if l["target"] == nid]
        if not incoming:
            label = node.get("label", "")
            if label in ("Employee", "Person", "Skill"):
                links_list.append({"source": wf_node_id, "target": nid, "type": "HAS_MEMBER"})
            elif label in ("Concept", "Document", "Project"):
                links_list.append({"source": cg_node_id, "target": nid, "type": "HAS_ENTITY"})
            else:
                links_list.append({"source": es_node_id, "target": nid, "type": "HAS_CONTEXT"})

    # Collect existing doc filenames/IDs from Neo4j to avoid duplicates
    existing_names = set()
    for n in nodes_map.values():
        if n["label"] == "Document":
            existing_names.add(n.get("name", "").lower())
            existing_names.add(n.get("properties", {}).get("filename", "").lower())

    for mnode in mongo_doc_nodes:
        # Skip if already in graph (by name match)
        if mnode["name"].lower() in existing_names:
            continue
        if mnode["id"] in nodes_map:
            continue

        nodes_map[mnode["id"]] = mnode

        # Auto-link to Org node (for documents + manual docs)
        if mnode["label"] in ("Document", "Tool") and "parent_site" not in mnode.get("properties", {}):
            link_key = f"{org_node_id}{mnode['id']}"
            if link_key not in links_seen:
                links_seen.add(link_key)
                rel = "HAS_SITE" if mnode["label"] == "Tool" else "HAS_DOCUMENT"
                links_list.append({
                    "source": org_node_id,
                    "target": mnode["id"],
                    "type": rel,
                })

    # 
    # STEP 4: Filter noise and orphaned links
    # 
    NOISE_BLACKLIST = ["hardware company", "cluaiz", "neural os"]
    
    valid_ids = set(nodes_map.keys())
    # 1. Filter links where both source and target exist in nodes_map
    valid_links = [l for l in links_list if l["source"] in valid_ids and l["target"] in valid_ids]
    
    # 2. Track which IDs are actually connected to something
    connected_ids = set()
    for l in valid_links:
        connected_ids.add(l["source"])
        connected_ids.add(l["target"])
    
    # 3. Final node reconstruction with filtering
    final_nodes = []
    for nid, node in nodes_map.items():
        name_lower = node.get("name", "").lower()
        
        # Skip blacklisted noise
        if any(term in name_lower for term in NOISE_BLACKLIST):
            continue
            
        # Skip orphaned 'Concept' nodes (they often feel like noise)
        # We keep 'Document' and 'Organization' even if orphaned for visibility
        if node.get("label") == "Concept" and nid not in connected_ids and "org_" not in nid:
            continue
            
        final_nodes.append(node)

    # Re-filter links one last time against final_nodes
    final_nids = {n["id"] for n in final_nodes}
    final_links = [l for l in valid_links if l["source"] in final_nids and l["target"] in final_nids]

    logger.info(f" [Graph API] Returning {len(final_nodes)} Nodes and {len(final_links)} Links (Filtered)")

    return {
        "success": True,
        "data": {
            "nodes": final_nodes,
            "links": final_links,
        },
    }


@router.delete("/node/{node_id}")
async def delete_graph_node(node_id: str):
    """
    Deletes a specific node from Neo4j by its element ID or internal ID.
    Also removes all connected relationships (DETACH DELETE).
    """
    if not neo4j_client.enabled:
        raise HTTPException(status_code=503, detail="Neo4j is not enabled")

    logger.info(f" [Graph API] Deleting Node: {node_id}")

    try:
        # Use elementId() for newer Neo4j, or id() for older. 
        # Since element_id in our parser is a string, we match by it.
        # We try both elementId and ID matching just in case.
        cypher = """
        MATCH (n)
        WHERE elementId(n) = $node_id OR str(id(n)) = $node_id
        DETACH DELETE n
        RETURN count(n) as deleted_count
        """
        res = await neo4j_client.run(cypher, node_id=node_id)
        
        count = res[0].get("deleted_count", 0) if res else 0
        
        if count == 0:
            logger.warning(f" [Graph API] Node {node_id} not found for deletion.")
            return {"success": False, "message": "Node not found or already deleted."}

        logger.info(f" [Graph API] Node {node_id} deleted successfully.")
        return {"success": True, "message": f"Node and its connections removed."}

    except Exception as e:
        logger.error(f" [Graph API] Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from src.services.neural.graph.visualizer import visualizer_service

@router.get("/visualize/{org_id}")
async def visualize_graph(org_id: str, limit: int = 200):
    """
    Endpoint to fetch real-time physical Neo4j graph topography.
    Used selectively by the Frontend React NeuralMap component
    to render exact Node logic and glowing Priority states.
    """
    try:
        data = await visualizer_service.get_visual_map(org_id, limit)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f" [Graph API] Visualization failed: {e}")
        return {
            "status": "error", 
            "message": f"Graph visualization failed: {e}", 
            "data": {"nodes": [], "links": []}
        }
