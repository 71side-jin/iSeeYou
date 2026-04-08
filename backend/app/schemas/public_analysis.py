from pydantic import BaseModel


class XaiRegion(BaseModel):
    id: str
    label: str
    x: float
    y: float
    width: float
    height: float
    score: float
    note: str


class XaiTimelineItem(BaseModel):
    label: str
    start: str
    end: str
    score: float
    note: str


class XaiTextHighlight(BaseModel):
    text: str
    weight: float
    tag: str


class XaiModalityBar(BaseModel):
    label: str
    score: float
    note: str


class XaiPayload(BaseModel):
    headline: str
    regions: list[XaiRegion]
    timeline: list[XaiTimelineItem]
    textHighlights: list[XaiTextHighlight]
    modalityBars: list[XaiModalityBar]


class ReasoningItem(BaseModel):
    title: str
    body: str


class MetricItem(BaseModel):
    label: str
    value: str
    detail: str


class StageItem(BaseModel):
    title: str
    body: str


class ApiAnalysisResponse(BaseModel):
    verdictLabel: str
    fakePercent: float
    realPercent: float
    confidence: float
    summary: str
    reasoning: list[ReasoningItem]
    metrics: list[MetricItem]
    stages: list[StageItem]
    xai: XaiPayload


class PublicAnalysisEnvelope(BaseModel):
    ok: bool
    analysis: ApiAnalysisResponse | None = None
    error: str | None = None