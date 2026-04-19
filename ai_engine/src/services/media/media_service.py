import io
import os
import tempfile
from PIL import Image
from minio import Minio
from minio.error import S3Error
from dotenv import load_dotenv
import logging
import subprocess
from pathlib import Path
from src.core.config import settings
import json

# Load environment variables
load_dotenv()

# Setup Logger
logger = logging.getLogger("MediaService")

# MinIO Client (Lazy initialization)
_minio_client = None

def get_minio_client():
    """Lazy-load MinIO client. If fails, fallback to local storage on a per-request basis."""
    global _minio_client
    
    if _minio_client is None:
        try:
            #  DEBUG: Log what credentials we're actually using
            logger.info(f" Attempting MinIO connection:")
            logger.info(f"   Endpoint: {settings.MINIO_ENDPOINT}")
            logger.info(f"   Access Key: {settings.MINIO_ACCESS_KEY}")
            logger.info(f"   Bucket: {settings.MINIO_BUCKET}")
            logger.info(f"   Secure: {settings.MINIO_SECURE}")
            
            client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            # Test Connection & Create Bucket with Public Policy
            if not client.bucket_exists(settings.MINIO_BUCKET):
                client.make_bucket(settings.MINIO_BUCKET)
                logger.info(f" Created MinIO Bucket: {settings.MINIO_BUCKET}")
                
                # Set Public Policy (Read-Only)
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}/*"]
                        }
                    ]
                }
                client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))
                logger.info(f" Set Public Read Policy on {settings.MINIO_BUCKET}")
            
            _minio_client = client
        except S3Error as e:
             logger.error(f" MinIO Error: {e}")
             return None
        except Exception as e:
            logger.warning(f" MinIO Connection Failed: {e}. Falling back to LOCAL STORAGE for this request.")
            return None
            
    return _minio_client

class MediaService:
    """
    Handles Media (Image/Video/Audio) compression, storage, and cleanup.
    - Images: 2MB  400-500KB (Pillow)
    - Videos: 15MB  2-3MB (FFmpeg H.264)
    - Audio: 5MB  500KB-1MB (FFmpeg MP3)
    - Files (PDF/DOC): No compression
    """

    # File type detection
    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'}
    VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.m4v'}
    AUDIO_EXTENSIONS = {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus'}
    DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'}

    @staticmethod
    def detect_file_type(filename: str) -> str:
        """Detect file type from extension."""
        ext = Path(filename).suffix.lower()
        if ext in MediaService.IMAGE_EXTENSIONS:
            return 'image'
        elif ext in MediaService.VIDEO_EXTENSIONS:
            return 'video'
        elif ext in MediaService.AUDIO_EXTENSIONS:
            return 'audio'
        else:
            return 'file'

    @staticmethod
    def compress_image(image_bytes: bytes, max_size_mb=2, quality=85, max_dimensions=(1920, 1080)) -> bytes:
        """
        Compresses and resizes an image to reduce file size.
        Target: 400-500KB
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB (standardize format)
            if img.mode in ("RGBA", "P", "LA"):
                if img.mode == "RGBA":
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3])
                    img = background
                else:
                    img = img.convert("RGB")
            
            # Resize if too big (maintain aspect ratio)
            img.thumbnail(max_dimensions, Image.Resampling.LANCZOS)
            
            # Compress and check size
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            compressed_size = len(output.getvalue())
            
            # If still too large, reduce quality further
            if compressed_size > max_size_mb * 1024 * 1024:
                output = io.BytesIO()
                img.save(output, format="JPEG", quality=70, optimize=True)
            
            logger.info(f" Image Compressed: {len(image_bytes)}  {len(output.getvalue())} bytes")
            return output.getvalue()
        except Exception as e:
            logger.error(f" Image Compression Failed: {e}")
            return image_bytes

    @staticmethod
    def compress_video(video_bytes: bytes, target_size_mb=3) -> bytes:
        """
        Compress video using FFmpeg (H.264 codec).
        Target: 2-3MB
        CRF 28 = Good balance between quality and size
        """
        try:
            # Create temp files
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as input_file:
                input_file.write(video_bytes)
                input_path = input_file.name
            
            output_path = input_path.replace('.mp4', '_compressed.mp4')
            
            # FFmpeg command (H.264, CRF 28, preset medium)
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-vcodec', 'libx264',
                '-crf', '28',  # Quality (18=best, 28=good, 35=smaller)
                '-preset', 'medium',  # Speed vs compression
                '-vf', 'scale=1280:-2',  # Max width 1280px (720p)
                '-acodec', 'aac',
                '-b:a', '64k',  # Audio bitrate
                '-movflags', '+faststart',  # Web optimization
                '-y',  # Overwrite output
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                logger.error(f" FFmpeg Error: {result.stderr}")
                return video_bytes
            
            # Read compressed video
            with open(output_path, 'rb') as f:
                compressed_data = f.read()
            
            # Cleanup
            os.unlink(input_path)
            os.unlink(output_path)
            
            logger.info(f" Video Compressed: {len(video_bytes)}  {len(compressed_data)} bytes")
            return compressed_data
        except subprocess.TimeoutExpired:
            logger.error(" Video compression timeout (>60s)")
            return video_bytes
        except FileNotFoundError:
            logger.error(" FFmpeg not installed! Install: apt-get install ffmpeg")
            return video_bytes
        except Exception as e:
            logger.error(f" Video Compression Failed: {e}")
            return video_bytes

    @staticmethod
    def compress_audio(audio_bytes: bytes, target_bitrate="64k") -> bytes:
        """
        Compress audio using FFmpeg (MP3 format).
        Target: 500KB-1MB
        64kbps = Good for voice, 128kbps = Music quality
        """
        try:
            # Create temp files
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as input_file:
                input_file.write(audio_bytes)
                input_path = input_file.name
            
            output_path = input_path.replace('.mp3', '_compressed.mp3')
            
            # FFmpeg command (MP3 conversion)
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-acodec', 'libmp3lame',
                '-b:a', target_bitrate,
                '-ar', '44100',  # Sample rate
                '-ac', '1',  # Mono (voice)
                '-y',
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                logger.error(f" FFmpeg Error: {result.stderr}")
                return audio_bytes
            
            # Read compressed audio
            with open(output_path, 'rb') as f:
                compressed_data = f.read()
            
            # Cleanup
            os.unlink(input_path)
            os.unlink(output_path)
            
            logger.info(f" Audio Compressed: {len(audio_bytes)}  {len(compressed_data)} bytes")
            return compressed_data
        except subprocess.TimeoutExpired:
            logger.error(" Audio compression timeout (>30s)")
            return audio_bytes
        except FileNotFoundError:
            logger.error(" FFmpeg not installed!")
            return audio_bytes
        except Exception as e:
            logger.error(f" Audio Compression Failed: {e}")
            return audio_bytes

    @staticmethod
    def upload_asset(file_bytes: bytes, chat_id: str, filename: str, asset_type=None, content_type="application/octet-stream") -> str:
        """
        Uploads a file to MinIO OR Local Storage with organized folder structure.
        Structure: {chat_id}/{filename} in cluaiz-chats bucket
        """
        try:
            # Auto-detect file type if not specified
            if not asset_type:
                asset_type = MediaService.detect_file_type(filename)
            
            # Compress based on type
            if asset_type == "image":
                processed_data = MediaService.compress_image(file_bytes)
            elif asset_type == "video":
                processed_data = MediaService.compress_video(file_bytes)
            elif asset_type == "audio":
                processed_data = MediaService.compress_audio(file_bytes)
            else:
                processed_data = file_bytes  # No compression for documents

            # Build MinIO path: {chat_id}/{filename}
            # Bucket is already 'cluaiz-chats', no need for 'chats/' prefix
            object_name = f"{chat_id}/{filename}"
            size = len(processed_data)

            minio_client = get_minio_client()

            if minio_client:
                #  MinIO Upload
                data_stream = io.BytesIO(processed_data)
                minio_client.put_object(
                    settings.MINIO_BUCKET,
                    object_name,
                    data_stream,
                    size,
                    content_type=content_type
                )
                logger.info(f" Uploaded to MinIO: {settings.MINIO_BUCKET}/{object_name} ({size} bytes)")
                
                # Return Direct Public URL (assuming public policy set)
                protocol = "https" if settings.MINIO_SECURE else "http"
                return f"{protocol}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_name}"
            
            else:
                #  Local Fallback Upload
                # Mimic structure: static/uploads/chats/{chat_id}/{filename}
                local_dir = Path("static/uploads") / Path(object_name).parent
                local_dir.mkdir(parents=True, exist_ok=True)
                
                local_file_path = local_dir / Path(object_name).name
                with open(local_file_path, "wb") as f:
                    f.write(processed_data)
                
                logger.info(f" Uploaded Locally: {local_file_path} ({size} bytes)")
                return f"/static/uploads/{object_name}"

        except Exception as e:
            logger.error(f" Upload Failed: {e}")
            raise e

    @staticmethod
    def delete_chat_assets(chat_id: str):
        """
        Deletes all assets (images + files + videos + audio) for a specific chat.
        """
        try:
            minio_client = get_minio_client()
            if minio_client:
                prefix = f"chats/{chat_id}/" # Adjusted prefix
                objects = minio_client.list_objects(settings.MINIO_BUCKET, prefix=prefix, recursive=True)
                for obj in objects:
                    minio_client.remove_object(settings.MINIO_BUCKET, obj.object_name)
                logger.info(f" Deleted MinIO files for {prefix}")
            else:
                # Local Deletion
                import shutil
                local_chat_dir = Path("static/uploads/chats") / f"{chat_id}"
                if local_chat_dir.exists():
                    shutil.rmtree(local_chat_dir)
                    logger.info(f" Deleted Local files for chats/{chat_id}")

        except Exception as e:
            logger.error(f" Cleanup Failed: {e}")

    @staticmethod
    def get_asset_url(object_path: str, expires_in_hours=24) -> str:
        """
        Generates a presigned URL or public URL.
        """
        try:
            minio_client = get_minio_client()
            if minio_client:
                # If we assume public bucket, just construct URL
                # return f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_path}"
                
                # But to start, let's use presigned just in case policy fails or private access needed
                from datetime import timedelta
                url = minio_client.presigned_get_object(
                    settings.MINIO_BUCKET,
                    object_path,
                    expires=timedelta(hours=expires_in_hours)
                )
                return url
            else:
                return f"/static/uploads/{object_path}"
        except Exception as e:
            logger.error(f" URL Generation Failed: {e}")
            return ""
