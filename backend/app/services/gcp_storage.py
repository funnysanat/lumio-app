import os
import uuid
import logging
from typing import Optional, Union
from google.cloud import storage

logger = logging.getLogger(__name__)

# Fetch environment variables
GCP_BUCKET_NAME = os.environ.get("GCP_BUCKET_NAME", "lumio-mock-bucket")
GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

# Initialize client only if credentials exist to prevent crashing local dev
storage_client = None
if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
    try:
        storage_client = storage.Client()
        logger.info(f"Initialized GCP Storage Client with bucket: {GCP_BUCKET_NAME}")
    except Exception as e:
        logger.error(f"Failed to initialize GCP Storage Client: {e}")
else:
    logger.warning("GCP credentials not found. Using MOCK storage service.")


async def upload_file_to_gcp(
    file_bytes: bytes, 
    destination_blob_name: str, 
    content_type: str = "application/octet-stream"
) -> str:
    """
    Uploads a file to GCP Cloud Storage.
    Returns the public URL of the uploaded file.
    """
    if not storage_client:
        logger.info(f"MOCK: Uploaded {len(file_bytes)} bytes to {destination_blob_name}")
        return f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{destination_blob_name}"

    try:
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_string(file_bytes, content_type=content_type)
        
        # Make the blob publicly viewable (or use signed URLs in production)
        # For MVP, we assume public access or frontend handles auth
        return f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{destination_blob_name}"
    
    except Exception as e:
        logger.error(f"Error uploading to GCP: {e}")
        return ""

async def generate_signed_url(blob_name: str, expiration_minutes: int = 15) -> str:
    """
    Generates a signed URL for secure, temporary access to a file.
    """
    if not storage_client:
        return f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{blob_name}"
        
    try:
        from datetime import timedelta
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        blob = bucket.blob(blob_name)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET",
        )
        return url
    except Exception as e:
        logger.error(f"Error generating signed URL: {e}")
        return ""
