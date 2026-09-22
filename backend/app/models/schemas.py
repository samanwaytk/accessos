from pydantic import BaseModel
from typing import List, Optional

class AnalyzeResponse(BaseModel):
    success: bool
    context: str
    summary: str
    important_information: List[str]
    confidence: float
    response: str
    needs_retry: bool
    context_id: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    context_id: str

class AskResponse(BaseModel):
    answer: str
    confidence: float
