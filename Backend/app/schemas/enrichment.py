from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.thought import ThoughtType, EnrichmentStatus


class GroqEnrichmentResult(BaseModel):
    title: str = Field(..., description="Short 3-6 word descriptive title")
    type: ThoughtType = Field(default="other", description="Classified thought category")
    summary: str = Field(..., description="1-2 sentence core idea summary")
    tags: List[str] = Field(default_factory=list, description="Array of 2-5 relevant topic tags")


class EnrichmentStatusResponse(BaseModel):
    thought_id: str
    enrichment_status: EnrichmentStatus
    title: Optional[str] = None
    summary: Optional[str] = None
    type: Optional[ThoughtType] = None
    tags: List[str] = []
    error: Optional[dict] = None
    is_partial: bool = False


class RetryEnrichmentResponse(BaseModel):
    thought_id: str
    status: str
    message: str
