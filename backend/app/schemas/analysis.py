from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


AnalysisStatus = Literal["processing", "success", "failed"]
ResultLabel = Literal["REAL", "FAKE"]
ModelType = Literal["text", "image", "video", "multimodal"]
SortOrder = Literal["asc", "desc"]


class AnalysisLogRead(BaseModel):
    id: int
    event_type: str
    message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisCreate(BaseModel):
    file_name: str
    mime_type: str
    file_size: int
    storage_key: str
    model_type: ModelType
    model_name: str


class AnalysisUpdateResult(BaseModel):
    status: AnalysisStatus
    result_label: ResultLabel | None = None
    confidence: float | None = None
    explanation: str | None = None
    inference_time_ms: int | None = None
    error_message: str | None = None
    finished_at: datetime | None = None


class AnalysisRead(BaseModel):
    id: UUID
    file_name: str
    mime_type: str
    file_size: int
    storage_key: str
    status: AnalysisStatus
    result_label: ResultLabel | None
    confidence: float | None
    explanation: str | None
    model_type: ModelType
    model_name: str
    inference_time_ms: int | None
    error_message: str | None
    created_at: datetime
    finished_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class AnalysisDetailRead(AnalysisRead):
    logs: list[AnalysisLogRead] = []
    file_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisListItemRead(BaseModel):
    id: UUID
    file_name: str
    status: AnalysisStatus
    result_label: ResultLabel | None
    confidence: float | None
    model_type: ModelType
    model_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisListResponse(BaseModel):
    items: list[AnalysisListItemRead]
    total: int
    page: int
    limit: int
    total_pages: int