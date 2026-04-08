from pydantic import BaseModel


class AnalysisSummaryStats(BaseModel):
    total_count: int
    success_count: int
    failed_count: int
    processing_count: int
    real_count: int
    fake_count: int