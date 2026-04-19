"""
Vault Router  Archived Memory API Endpoints
Cluaiz Neural OS | api/routes/clickhouse/vault_router.py
"""
from fastapi import APIRouter
from src.services.clickhouse_manager.vault.search import vault_search
from src.services.clickhouse_manager.vault.archiver import archiver

router = APIRouter(prefix="/ch/vault", tags=["CH Vault"])

@router.get("/stats")
def get_vault_stats():
    """Returns overall ClickHouse storage health and memory counts."""
    return vault_search.get_stats()

@router.get("/search")
def search_vault(q: str):
    """Full-text search across all permanently archived topic memories."""
    return {"results": vault_search.search(q)}

@router.delete("/purge/{org_id}")
def purge_org_vault(org_id: str):
    """Securely wipes all archived memories for a given organization."""
    from src.services.clickhouse_manager.core.connection import ch_connection
    client = ch_connection.get_client()
    if not client:
        return {"status": "Error", "message": "CH not connected"}
    client.command(f"ALTER TABLE archived_memories DELETE WHERE org_id = '{org_id}'")
    return {"status": "success", "message": f"All archives for {org_id} incinerated."}
