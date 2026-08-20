import boto3
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.bucket = settings.R2_BUCKET_NAME
        self.is_mock = settings.R2_ACCOUNT_ID == "mock_account_id"
        if not self.is_mock:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name="auto"
            )

    def upload_text_file(self, file_name: str, content: str) -> str:
        """
        Uploads a text file to R2. Mocks the upload if using placeholder keys.
        """
        if self.is_mock:
            print(f"MOCK UPLOAD: Saved {file_name} locally instead of R2.")
            return f"mock://{self.bucket}/{file_name}"
            
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=file_name,
            Body=content.encode('utf-8')
        )
        return f"r2://{self.bucket}/{file_name}"

    def upload_file(self, file_name: str, content: bytes, content_type: str = "audio/webm") -> str:
        """
        Uploads a binary file to R2 with content type. Mocks if using placeholder keys.
        """
        if self.is_mock:
            print(f"MOCK UPLOAD: Saved {file_name} locally instead of R2. Content Type: {content_type}")
            return f"mock://{self.bucket}/{file_name}"
            
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=file_name,
            Body=content,
            ContentType=content_type
        )
        return f"r2://{self.bucket}/{file_name}"

storage_service = StorageService()
