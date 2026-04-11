import uuid
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    __table_args__ = (
        CheckConstraint("status IN ('processing', 'success', 'failed')", name="ck_analyses_status"),
        CheckConstraint("result_label IN ('REAL', 'FAKE')", name="ck_analyses_result_label"),
        CheckConstraint("model_type IN ('text', 'image', 'video', 'multimodal')", name="ck_analyses_model_type"),
        CheckConstraint("file_size >= 0", name="ck_analyses_file_size"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_analyses_confidence"),
        CheckConstraint("inference_time_ms >= 0", name="ck_analyses_inference_time_ms"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    result_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    confidence: Mapped[float | None] = mapped_column(DOUBLE_PRECISION, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    inference_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        index=True,
    )
    finished_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    logs: Mapped[list["AnalysisLog"]] = relationship(
        "AnalysisLog",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        index=True,
    )

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="logs")