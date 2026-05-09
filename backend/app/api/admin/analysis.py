from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analysis import (
    AnalysisRead,
    AnalysisDetailRead,
    AnalysisListResponse,
    AnalysisStatus,
    ResultLabel,
    ModelType,
)
from app.repositories.analysis_repository import AnalysisRepository

from app.services.storage_service import StorageService

from fastapi.responses import StreamingResponse

from app.api.admin.auth import get_current_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/analysis", tags=["admin-analysis"])


@router.get("", response_model=AnalysisListResponse)
def get_analysis_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: AnalysisStatus | None = Query(None),
    result_label: ResultLabel | None = Query(None),
    model_type: ModelType | None = Query(None),
    model_name: str | None = Query(None),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    repo = AnalysisRepository()
    return repo.list_paginated(
        db=db,
        page=page,
        limit=limit,
        status=status,
        result_label=result_label,
        model_type=model_type,
        model_name=model_name,
        sort_order=sort_order,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailRead)
def get_analysis_detail(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    repo = AnalysisRepository()

    analysis = repo.get_by_id(db, analysis_id)

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found",
        )

    return analysis


@router.get("/{analysis_id}/preview")
def preview_analysis_file(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    repo = AnalysisRepository()

    analysis = repo.get_by_id(db, analysis_id)

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found",
        )

    storage_service = StorageService()

    file_data = storage_service.get_file_stream(
        analysis.storage_key
    )

    return StreamingResponse(
        file_data["body"],
        media_type=file_data["content_type"],
        headers={
            "Content-Disposition":
                f'inline; filename="{analysis.file_name}"'
        },
    )

