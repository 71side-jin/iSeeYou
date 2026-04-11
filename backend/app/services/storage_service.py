import uuid
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings


class StorageService:
    def __init__(self):
        self.storage_root = Path(settings.STORAGE_ROOT)

    def save_upload(self, file: UploadFile, dir_name: str) -> tuple[str, int]:
        ext = Path(file.filename or "").suffix
        unique_name = f"{uuid.uuid4()}{ext}"

        dir_path = self.storage_root / dir_name
        dir_path.mkdir(parents=True, exist_ok=True)

        file_path = dir_path / unique_name

        content = file.file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        storage_key = str(file_path).replace("\\", "/")
        file_size = len(content)
        return storage_key, file_size