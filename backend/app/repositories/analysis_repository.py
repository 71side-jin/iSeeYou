from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.analysis import Analysis, AnalysisLog
from app.schemas.analysis import AnalysisCreate, AnalysisUpdateResult


class AnalysisRepository:
    def create(self, db: Session, data: AnalysisCreate) -> Analysis:
        analysis = Analysis(**data.model_dump(), status="processing")
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    def add_log(self, db: Session, analysis_id: UUID, event_type: str, message: str | None = None) -> AnalysisLog:
        log = AnalysisLog(
            analysis_id=analysis_id,
            event_type=event_type,
            message=message,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_by_id(self, db: Session, analysis_id: UUID) -> Analysis | None:
        return db.query(Analysis).filter(Analysis.id == analysis_id).first()

    def list_all(self, db: Session, skip: int = 0, limit: int = 20) -> list[Analysis]:
        return (
            db.query(Analysis)
            .order_by(Analysis.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_result(self, db: Session, analysis: Analysis, data: AnalysisUpdateResult) -> Analysis:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(analysis, field, value)

        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    def mark_success(
        self,
        db: Session,
        analysis: Analysis,
        result_label: str,
        confidence: float,
        explanation: str | None,
        inference_time_ms: int,
    ) -> Analysis:
        analysis.status = "success"
        analysis.result_label = result_label
        analysis.confidence = confidence
        analysis.explanation = explanation
        analysis.inference_time_ms = inference_time_ms
        analysis.finished_at = datetime.now(timezone.utc)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    def mark_failed(self, db: Session, analysis: Analysis, error_message: str) -> Analysis:
        analysis.status = "failed"
        analysis.error_message = error_message
        analysis.finished_at = datetime.now(timezone.utc)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis