from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from src.services.media.media_service import MediaService
import logging

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = logging.getLogger("UploadRouter")

@router.post("")
async def upload_asset(
    file: UploadFile = File(...),
    chat_id: str = Form(...),
    asset_type: str = Form(...),  # "image" or "file"
    send_to_ai: str = Form("false")
):
    """
    Upload and store an image or file.
    - Images: Can be sent to AI (Gemini Vision)
    - Files: Stored for Agent only
    """
    try:
        # Read file content
        file_bytes = await file.read()
        
        # Determine content type
        content_type = file.content_type or "application/octet-stream"
        
        # Upload to MinIO (compression handled inside)
        url = MediaService.upload_asset(
            file_bytes=file_bytes,
            chat_id=chat_id,
            filename=file.filename,
            asset_type=asset_type,
            content_type=content_type
        )
        
        logger.info(f"✅ Uploaded {asset_type}: {file.filename} for chat-{chat_id}")
        
        return {
            "success": True,
            "url": url,
            "filename": file.filename,
            "send_to_ai": send_to_ai == "true"
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"❌ Upload failed: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        raise HTTPException(status_code=500, detail=str(e))
