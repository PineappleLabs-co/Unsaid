from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class TranscriptionJobCreate(BaseModel):
    thought_id: str
    audio_path: Optional[str] = None


class TranscriptionJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    thought_id: str
    status: Literal["queued", "processing", "complete", "failed"]
    transcript: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
