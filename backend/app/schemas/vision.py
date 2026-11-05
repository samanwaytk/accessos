from typing import Literal
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    image: str = Field(min_length=30, max_length=9_000_000, description="JPEG or PNG data URL")
    question: str | None = Field(default=None, max_length=500)
    session_id: str = Field(min_length=1, max_length=64)
    mode: Literal['scene', 'ocr'] = 'scene'


class Observation(BaseModel):
    name: str = Field(max_length=80)
    position: str = Field(max_length=80)


class AnalyzeResponse(BaseModel):
    answer: str
    scene_summary: str
    observations: list[Observation] = []
    memory_used: bool = False


class MemoryObservation(BaseModel):
    timestamp: str
    scene_summary: str
    observations: list[Observation]


class MemoryResponse(BaseModel):
    observations: list[MemoryObservation]
