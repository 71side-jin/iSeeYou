from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.admin.auth import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.analysis import Analysis

router = APIRouter(prefix="/stats", tags=["admin-stats"])


def count_analysis(db: Session, *filters) -> int:
    query = db.query(func.count(Analysis.id))

    for condition in filters:
        query = query.filter(condition)

    return query.scalar() or 0


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    return {
        "total_count": count_analysis(db),
        "success_count": count_analysis(db, Analysis.status == "success"),
        "failed_count": count_analysis(db, Analysis.status == "failed"),
        "processing_count": count_analysis(db, Analysis.status == "processing"),
        "real_count": count_analysis(db, Analysis.result_label == "REAL"),
        "fake_count": count_analysis(db, Analysis.result_label == "FAKE"),
    }
