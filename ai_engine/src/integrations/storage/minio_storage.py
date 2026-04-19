from minio import Minio
from minio.error import S3Error
import os
from src.utils.logger import logger
from datetime import timedelta

class MinIOStorage:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ROOT_USER", "admin")
        self.secret_key = os.getenv("MINIO_ROOT_PASSWORD", "password123")
        self.bucket_name = "cluaiz-raw-data"
        self.secure = False  # False for http (localhost), True for https

        try:
            self.client = Minio(
                self.endpoint.replace("http://", "").replace("https://", ""),
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
            self._ensure_bucket_exists()
        except Exception as e:
            logger.error(f" MinIO Connection Failed: {e}")
            self.client = None

    def _ensure_bucket_exists(self):
        if not self.client: return
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f" Created MinIO Bucket: {self.bucket_name}")
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f" Created MinIO Bucket: {self.bucket_name}")
            
            # Set Public Read Policy (JSON string)
            policy = '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": ["*"] }, "Action": ["s3:GetObject"], "Resource": ["arn:aws:s3:::' + self.bucket_name + '/*"] } ] }'
            self.client.set_bucket_policy(self.bucket_name, policy)
            logger.info(f" Set Public Read Policy for: {self.bucket_name}")

        except Exception as e:
            logger.error(f" Failed to check/create bucket: {e}")

    def upload_content(self, content: any, filename: str, content_type="text/html"):
        """
        Uploads content (String or Bytes) to MinIO.
        Returns: Presigned URL or Direct Path
        """
        if not self.client: return None
        try:
            import io
            
            # Handle Bytes (Images/PDFs) vs String (HTML/JSON)
            if isinstance(content, bytes):
                data_bytes = content
            else:
                data_bytes = content.encode('utf-8')

            data_stream = io.BytesIO(data_bytes)
            
            self.client.put_object(
                self.bucket_name,
                filename,
                data_stream,
                length=len(data_bytes),
                content_type=content_type
            )
            logger.info(f" Uploaded to MinIO: {filename}")
            return f"s3://{self.bucket_name}/{filename}"
        except Exception as e:
            logger.error(f" MinIO Upload Failed: {e}")
            return None

    def get_file_url(self, filename: str):
        """Generates a temporary view URL (valid for 1 hour)"""
        if not self.client: return None
        try:
            return self.client.get_presigned_url(
                "GET",
                self.bucket_name,
                filename,
                expires=timedelta(hours=1)
            )
        except Exception as e:
            logger.error(f" Failed to generate URL: {e}")
            return None

storage_client = MinIOStorage()
