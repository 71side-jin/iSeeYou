from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analysis", tags=["public-analysis"])


@router.post("")
def create_analysis(
    file: UploadFile = File(...),
    fileName: str = Form(...),
    page: str = Form(...),
    selectedMode: str = Form(...),
    settings: str = Form("{}"),
    db: Session = Depends(get_db),
):
    service = AnalysisService()
    return service.run_analysis(
        db=db,
        file=file,
        file_name=fileName,
        page=page,
        selected_mode=selectedMode,
        settings_raw=settings,
    )