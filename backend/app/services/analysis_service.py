import json
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.repositories.analysis_repository import AnalysisRepository
from app.schemas.analysis import AnalysisCreate
from app.services.storage_service import StorageService
from app.services.inference_service import InferenceService


class AnalysisService:
    def __init__(self):
        self.repo = AnalysisRepository()
        self.storage_service = StorageService()
        self.inference_service = InferenceService()

    def run_analysis(
        self,
        *,
        db: Session,
        file: UploadFile,
        file_name: str,
        page: str,
        selected_mode: str,
        settings_raw: str,
    ):
        settings = json.loads(settings_raw)

        file_type = "video" if page == "multimodal" else page

        storage_key, file_size = self.storage_service.save_upload(file, file_type)

        analysis = self.repo.create(
            db,
            AnalysisCreate(
                file_name=file_name,
                file_type=file_type,
                mime_type=file.content_type or "application/octet-stream",
                file_size=file_size,
                storage_key=storage_key,
                model_type=page,
                model_name=selected_mode,
            ),
        )

        try:
            result = self.inference_service.analyze(
                page=page,
                selected_mode=selected_mode,
                storage_key=storage_key,
                file_name=file_name,
                settings=settings,
            )

            db_result = result["db_result"]

            self.repo.mark_success(
                db,
                analysis,
                result_label=db_result["result_label"],
                confidence=db_result["confidence"],
                explanation=db_result["explanation"],
                inference_time_ms=db_result["inference_time_ms"],
            )

            return {
                "ok": True,
                "analysis": result
            }

        except Exception as e:
            self.repo.mark_failed(db, analysis, str(e))

            return {
                "ok": False,
                "error": str(e)
            }