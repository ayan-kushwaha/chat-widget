from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.knowledge.crawl_service import crawl_service

class CrawlRequest(BaseModel):
    url: str
    org_id: str
    allow_ui_actions: bool = False  #  Skill 13: UI Teleporter Opt-In

router = APIRouter()

@router.post("/crawl")
async def crawl_website(request: CrawlRequest):
    """
    Crawls a website using Playwright (Stealth).
    Returns cleaned content.
    """
    try:
        from src.utils.logger import logger
        logger.info(f" Crawling URL: {request.url} | allow_ui_actions: {request.allow_ui_actions}")
        
        result = await crawl_service.crawl_url(request.url, allow_ui_actions=request.allow_ui_actions)
        
        if result.get("status") == "failed":
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Crawl Service Crash: {str(e)}")

@router.post("/discover")
async def discover_sitemap(request: CrawlRequest):
    """
    Discovers all internal links from a given URL.
    Returns list of URLs.
    """
    # Use Fast Static Discovery (Legacy Parity)
    result = await crawl_service.discover_links(request.url)
    
    if result.get("status") == "failed":
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return {"urls": result.get("links", []), "title": result.get("title", "")}


class EmbedRequest(BaseModel):
    text: str
    metadata: dict
    org_id: str
    site_id: str = None
    url: str = None

@router.post("/embed")
async def embed_content(request: EmbedRequest):
    """
    Embeds text content into ChromaDB.
    """
    from src.core.memory import memory as memory_manager
    
    # Enrich metadata
    metadata = request.metadata or {}
    metadata["org_id"] = request.org_id
    if request.site_id:
        metadata["site_id"] = request.site_id
    if request.url:
        metadata["url"] = request.url
        
    # Use memory manager to add document
    # Note: memory_manager.add_document expects collection_name. 
    # Use org_id as collection or a shared one? 
    # Current design: specific collection per org/brain or shared?
    # memory.py uses self.collection sent in init? No, check memory.py
    
    success = await memory_manager.add_document(
        collection_name=request.org_id, 
        document=request.text, 
        metadata=metadata
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to embed document")
        
    return {"status": "success", "message": "Content embedded successfully"}

class ChunkData(BaseModel):
    text: str
    metadata: dict

class BatchEmbedRequest(BaseModel):
    orgId: str
    sourceId: str = None
    sourceType: str = "website"
    url: str = None
    tags: list[str] = [] #  HYBRID SEARCH: Tags for filtering
    chunks: list[ChunkData]

@router.post("/embed/batch")
async def embed_batch(request: BatchEmbedRequest):
    """
    Batch embedding endpoint - handles multiple chunks in one request.
    Uses bulk insertion for maximum performance.
    """
    from src.core.memory import memory as memory_manager
    from src.utils.logger import logger
    
    if not request.chunks:
        return {"status": "success", "ids": []}
    
    valid_documents = []
    valid_metadatas = []
    skipped = 0
    
    for idx, chunk in enumerate(request.chunks):
        try:
            text = chunk.text.strip() if chunk.text else ""
            
            # Validation: Skip empty or too-short chunks
            if len(text) < 10:
                skipped += 1
                continue
            
            # Prepare metadata
            meta = chunk.metadata.copy() if chunk.metadata else {}
            meta["org_id"] = request.orgId
            if request.sourceId:
                meta["source_id"] = request.sourceId
            if request.sourceType:
                meta["source_type"] = request.sourceType
            if request.url:
                meta["url"] = request.url
            
            #  HYBRID SEARCH: Handle tags explicitly
            chunk_tags = chunk.metadata.get("tags", []) if chunk.metadata else []
            if not isinstance(chunk_tags, list):
                chunk_tags = []
            
            all_tags = list(set(request.tags + chunk_tags))
            if all_tags:
                meta["tags"] = ", ".join(all_tags) 
            elif "tags" in meta:
                del meta["tags"]
            
            # Flatten lists for ChromaDB
            for k, v in list(meta.items()):
                if isinstance(v, list):
                    meta[k] = ", ".join(map(str, v))
            
            valid_documents.append(text)
            valid_metadatas.append(meta)
                
        except Exception as e:
            logger.error(f"Error preparing metadata for chunk {idx}: {str(e)}")
    
    if not valid_documents:
        raise HTTPException(
            status_code=400,
            detail=f"No chunks were valid for embedding. {skipped} chunks were too short."
        )

    #  BULK INSERTION
    try:
        point_ids = await memory_manager.add_documents(
            collection_name=request.orgId,
            documents=valid_documents,
            metadatas=valid_metadatas
        )
    except Exception as e:
        logger.error(f"Bulk embedding failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk Embedding Error: {str(e)}")
    
    #  NEURAL OS PAGE INDEX (Vectorless RAG Tree)
    if request.sourceId and valid_documents:
        try:
            from src.services.neural.indexer import neural_indexer
            from src.database.mongo import db
            
            if db.client:
                display_name = request.url or f"{request.sourceType}_{request.sourceId[:6]}"
                logger.info(f" [KnowledgeAPI] Triggering BACKGROUND Neural Indexer for '{display_name}'...")
                
                #  PERSISTENCE DELAY: Wait 2 seconds for Qdrant to fully commit
                # This ensures the indexer can find the vectors when it runs
                import asyncio
                
                # Filter point_ids to ensure no booleans/garbage
                safe_v_ids = [str(pid) for pid in point_ids] if isinstance(point_ids, list) else []

                async def run_indexing_delayed(v_ids: list):
                    await asyncio.sleep(2.0) # Buffer for storage sync
                    try:
                        logger.info(f" [KnowledgeAPI] Dispatching indexer for {display_name} with {len(v_ids)} vector IDs")
                        await neural_indexer.index_document(
                            chunks=valid_documents,
                            doc_id=request.sourceId,
                            org_id=request.orgId,
                            filename=display_name,
                            db=db.client.cluaiz,
                            vector_ids=v_ids
                        )
                    except Exception as e:
                        logger.error(f" Delayed Neural Indexer failed for {display_name}: {e}")

                # DEBUG: Log the IDs before sending
                logger.debug(f" [KnowledgeAPI] Point IDs detected: {safe_v_ids}")
                
                # Pass the actual IDs returned from memory_manager.add_documents
                asyncio.create_task(run_indexing_delayed(safe_v_ids))
            else:
                logger.warning(" Database not connected. Skipping Neural Indexing.")
        except Exception as ex:
            logger.error(f" Failed to trigger Neural Indexer: {ex}")

    logger.info(f" Bulk embedded {len(valid_documents)} chunks ({skipped} skipped)")
    return {"status": "success", "ids": point_ids}


class MetadataRequest(BaseModel):
    text: str
    context: str = None

@router.post("/metadata")
async def generate_metadata(request: MetadataRequest):
    """
    Generates summary and tags for text content using AI.
    """
    from src.services.metadata_service import metadata_service
    return await metadata_service.generate_metadata(request.text, request.context)


class SourceMetadataRequest(BaseModel):
    orgId: str
    sourceId: str
    sourceType: str

@router.post("/source-metadata")
async def generate_source_metadata(request: SourceMetadataRequest):
    """
    Generates global metadata (Summary, Tags, Intent) for a full source 
    by reading its compiled Page Index YAML trees from MongoDB.
    This fulfills the "Vectorless Metadata Generation" strategy.
    """
    from src.database.mongo import db
    from src.services.metadata_service import metadata_service
    from bson import ObjectId
    import yaml
    
    if not db.client:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        source_id_obj = ObjectId(request.sourceId) if len(str(request.sourceId)) == 24 else request.sourceId
    except:
        source_id_obj = request.sourceId
        
    query = {"_id": source_id_obj}
    # For extra safety, allow both string/objectId org matches if needed, but simple is usually fine
    
    combined_text = []

    # Strategy varies by source type
    if request.sourceType == 'website':
        site = await db.client.cluaiz.sites.find_one(query)
        if not site or "pages" not in site:
            raise HTTPException(status_code=404, detail="Site or pages not found")
            
        for page in site.get("pages", []):
            if page.get("isActive") is False:
                continue
                
            page_index = page.get("page_index")
            if not page_index:
                continue
                
            try:
                tree = yaml.safe_load(page_index)
                if not tree: continue
                # Extract top 2 chunks from this page
                chunks_extracted = 0
                for node in tree:
                    if chunks_extracted >= 2: break
                    combined_text.append(f"Page Title: {page.get('title', 'Unknown')}")
                    combined_text.append(f"Section: {node.get('title', '')}")
                    combined_text.append(f"Summary: {node.get('summary', '')}")
                    chunks_extracted += 1
            except Exception as e:
                logger.warning(f"Failed to parse page_index for {page.get('url')}: {e}")
                
    else:
        # For files, apis, manual
        doc = None
        if request.sourceType == 'file':
            doc = await db.client.cluaiz.knowledgedocuments.find_one(query)
            if not doc: doc = await db.client.cluaiz.documents.find_one(query) # Fallback
        elif request.sourceType == 'api':
            doc = await db.client.cluaiz.apisources.find_one(query)
        elif request.sourceType == 'manual':
            doc = await db.client.cluaiz.manualdocuments.find_one({"_id": source_id_obj, "orgId": request.orgId})
        
        if not doc or "page_index" not in doc:
            raise HTTPException(status_code=404, detail=f"Source ({request.sourceType}) or page_index not found")
            
        try:
            tree = yaml.safe_load(doc["page_index"])
            if tree:
                # Extract top 10 chunks from the single document
                for node in tree[:10]:
                    combined_text.append(f"Section: {node.get('title', '')}")
                    combined_text.append(f"Summary: {node.get('summary', '')}")
        except Exception as e:
            logger.warning(f"Failed to parse page_index for doc {request.sourceId}: {e}")

    final_text = "\n".join(combined_text)
    if not final_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any content from page index. Has it been indexed yet?")

    # Generate holistic metadata sending the compiled tree context
    return await metadata_service.generate_metadata(final_text, context=f"Source Type: {request.sourceType}")


class DeleteVectorsRequest(BaseModel):
    orgId: str
    ids: list[str] = []  # Specific chunk IDs to delete
    filter: dict = {}    # Metadata filter (e.g., {"source_id": "xyz"})


@router.delete("/vectors")
async def delete_vectors(request: DeleteVectorsRequest):
    """
    Deletes vectors from the Vector Database.
    Used for Clean Deletion when files/websites are removed.
    """
    from src.core.memory import memory as memory_manager
    from src.utils.logger import logger
    
    try:
        deleted_count = 0
        
        # Method 1: Delete by specific IDs (more precise)
        if request.ids:
            # ChromaDB delete by IDs
            await memory_manager.delete_by_ids(
                collection_name=request.orgId,
                ids=request.ids
            )
            deleted_count = len(request.ids)
            logger.info(f" Deleted {deleted_count} vectors by ID")
        
        # Method 2: Delete by metadata filter (fallback)
        elif request.filter:
            # ChromaDB delete by metadata
            deleted_count = await memory_manager.delete_by_filter(
                collection_name=request.orgId,
                filter=request.filter
            )
            logger.info(f" Deleted {deleted_count} vectors by filter: {request.filter}")
        
        else:
            raise HTTPException(status_code=400, detail="Must provide either 'ids' or 'filter'")
        
        return {
            "status": "success",
            "deleted": deleted_count,
            "message": f"Cleaned {deleted_count} vectors from Vector DB"
        }
        
    except Exception as e:
        logger.error(f" Vector deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Vector deletion failed: {str(e)}")

class BusinessProfileRequest(BaseModel):
    businessProfile: dict

@router.post("/generate_strategy")
async def generate_strategy(request: BusinessProfileRequest):
    """
    Generates a Knowledge Classification & Strategy Guide based on the Organization's Business Profile.
    """
    from src.core.brain import brain
    from src.utils.logger import logger
    import json
    import re
    
    profile = request.businessProfile

    prompt = f"""
    You are an elite AI Architect and Data Strategist. Your goal is to guide a business owner on exactly what files, documents, and data they need to upload to train their Custom AI Brain based on their specific business profile.
    
    Here is the Business Profile:
    - Business Name: {profile.get('name', 'Unknown')}
    - Industry: {profile.get('industry', 'General')}
    - Sub Category: {profile.get('subCategory', 'N/A')}
    - Business Model: {profile.get('businessModel', 'N/A')}
    - Target Audience: {profile.get('targetAudience', 'N/A')}
    - Primary Goal: {profile.get('primaryGoal', 'N/A')}
    - Hero Offering: {profile.get('heroOffering', 'N/A')}
    - Description: {profile.get('businessDescription', 'N/A')}

    Generate a "Knowledge Classification & Strategy Guide" tailored explicitly to this exact business. Do NOT give generic advice. Give them concrete file names and categories they must upload. Keep titles and descriptions short, actionable, and professional.

    OUTPUT FORMAT: You MUST return a strictly valid JSON object matching the exact structure below, without Markdown block quotes or extra text.
    {{
      "overview": "A brief 2-sentence strategy on why training the AI is crucial for this specific business and what to focus on.",
      "categories": [
        {{
          "title": "Category Name (e.g., Core Products )",
          "description": "Why this category matters.",
          "recommendedFiles": [
            "Exact_suggested_file_name_1.pdf",
            "Pricing_Guide_2024.xlsx"
          ],
          "isRequired": true
        }},
        ... (Generate 4-5 highly relevant categories)
      ]
    }}
    """
    
    try:
        logger.info(f" [Strategy] Generating Knowledge Strategy for industry: {profile.get('industry')}")
        result = await brain.generate(prompt)
        
        response_text = result.get("text", "") if isinstance(result, dict) else str(result)
        
        # Clean JSON 
        match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not match:
             logger.error(f" [Strategy] No JSON block found in response.")
             raise ValueError("No valid JSON found in LLM response")
            
        cleaned = match.group(0).strip()
        data = json.loads(cleaned)
        
        logger.info(f" [Strategy] Knowledge Strategy generated successfully.")
        return {"status": "success", "strategy": data}

    except Exception as e:
        logger.error(f" Knowledge Strategy generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Knowledge Strategy generation failed: {str(e)}")
