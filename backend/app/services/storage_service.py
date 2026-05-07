import uuid
import boto3
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings
from botocore.client import Config
from io import BytesIO

class StorageService:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.NCLOUD_ACCESS_KEY,
            aws_secret_access_key=settings.NCLOUD_SECRET_KEY,
            endpoint_url=settings.NCLOUD_ENDPOINT,
            config=Config(signature_version="s3"),
        )

        self.bucket = settings.NCLOUD_BUCKET

    def save_upload(self, file: UploadFile, dir_name: str) -> tuple[str, int]:
        ext = Path(file.filename or "").suffix
        unique_name = f"{uuid.uuid4()}{ext}"

        storage_key = f"{dir_name}/{unique_name}"

        content = file.file.read()
        file_size = len(content)

        self.s3.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=content,
            ContentType=file.content_type or "application/octet-stream",
        )

        return storage_key, file_size
    
    def get_file_stream(self, storage_key: str):
        obj = self.s3.get_object(
            Bucket=self.bucket,
            Key=storage_key,
        )

        return {
            "body": obj["Body"],
            "content_type": obj.get(
                "ContentType",
                "application/octet-stream",
            ),
        }
    
    