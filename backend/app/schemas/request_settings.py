from typing import Literal
from pydantic import BaseModel


class AnalysisRequestSettings(BaseModel):
    imageScope: Literal["full-scene", "face-focus"] = "full-scene"
    xaiDepth: Literal["signature", "deep-dive"] = "signature"
    companionText: str = ""