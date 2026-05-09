from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.analysis import Analysis

from app.api.admin.auth import get_current_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/stats", tags=["admin-stats"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    total = db.query(func.count(Analysis.id)).scalar()
    success = db.query(func.count()).filter(Analysis.status == "success").scalar()
    failed = db.query(func.count()).filter(Analysis.status == "failed").scalar()
    processing = db.query(func.count()).filter(Analysis.status == "processing").scalar()

    real = db.query(func.count()).filter(Analysis.result_label == "REAL").scalar()
    fake = db.query(func.count()).filter(Analysis.result_label == "FAKE").scalar()

    return {
        "total_count": total,
        "success_count": success,
        "failed_count": failed,
        "processing_count": processing,
        "real_count": real,
        "fake_count": fake,
    }