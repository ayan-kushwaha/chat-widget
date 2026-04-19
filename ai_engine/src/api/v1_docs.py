from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
# Updated Import path
from src.services.knowledge.doc_service import doc_service

router = APIRouter()

@router.post("/parse-document")
async def parse_doc(
    file: UploadFile = File(...),
    doc_id: Optional[str] = Form(None),
    org_id: Optional[str] = Form(None)
):
    # Using the instance from the new location
    result = await doc_service.parse_document(file, doc_id, org_id)
    return result
