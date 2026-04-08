from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analysis import AnalysisRead, AnalysisDetailRead
from app.repositories.analysis_repository import AnalysisRepository

from uuid import UUID

router = APIRouter(prefix="/analysis", tags=["admin-analysis"])


@router.get("", response_model=list[AnalysisRead])
def get_analysis_list(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    repo = AnalysisRepository()
    return repo.list_all(db, skip=skip, limit=limit)


@router.get("/{analysis_id}", response_model=AnalysisDetailRead)
def get_analysis_detail(
    analysis_id: UUID,
    db: Session = Depends(get_db),
):
    repo = AnalysisRepository()
    analysis = repo.get_by_id(db, analysis_id)

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis