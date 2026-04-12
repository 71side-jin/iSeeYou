from datetime import datetime, timezone
from math import ceil
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.analysis import Analysis, AnalysisLog
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisUpdateResult,
    AnalysisStatus,
    ResultLabel,
    ModelType,
    SortOrder,
)


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

    def list_paginated(
        self,
        db: Session,
        page: int = 1,
        limit: int = 10,
        status: AnalysisStatus | None = None,
        result_label: ResultLabel | None = None,
        model_type: ModelType | None = None,
        model_name: str | None = None,
        sort_order: SortOrder = "desc",
    ) -> dict:
        query = db.query(Analysis)

        if status is not None:
            query = query.filter(Analysis.status == status)

        if result_label is not None:
            query = query.filter(Analysis.result_label == result_label)

        if model_type is not None:
            query = query.filter(Analysis.model_type == model_type)

        if model_name is not None:
            query = query.filter(Analysis.model_name == model_name)

        total = query.count()

        if sort_order == "asc":
            query = query.order_by(Analysis.created_at.asc())
        else:
            query = query.order_by(Analysis.created_at.desc())

        items = (
            query.offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        total_pages = ceil(total / limit) if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

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