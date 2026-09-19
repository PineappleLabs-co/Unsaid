from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

ThoughtType = Literal[
    "ideas",
    "projects",
    "content",
    "learning",
    "reminders",
    "personal",
    "other"
]

CaptureState = Literal["held", "committed"]
AudioRetention = Literal["delete_after_transcription", "keep"]
TranscriptSource = Literal["provisional", "server"]
EnrichmentStatus = Literal["pending", "processing", "complete", "partial", "failed", "disabled"]


class ThoughtCreate(BaseModel):
    id: str = Field(..., description="Client-generated UUID for idempotency")
    raw_text: Optional[str] = None
    capture_state: CaptureState = "committed"
    audio_ref: Optional[str] = None
    audio_duration_seconds: Optional[float] = None
    audio_retention: AudioRetention = "delete_after_transcription"
    transcript: Optional[str] = None
    transcript_source: TranscriptSource = "server"
    send_to_ai: bool = True
    client_created_at: Optional[datetime] = None


class ThoughtUpdate(BaseModel):
    base_version: int = Field(..., description="Optimistic concurrency control counter")
    raw_text: Optional[str] = None
    capture_state: Optional[CaptureState] = None
    transcript: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    type: Optional[ThoughtType] = None
    tags: Optional[List[str]] = None
    send_to_ai: Optional[bool] = None
    audio_retention: Optional[AudioRetention] = None


class ThoughtResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    device_id: str
    raw_text: Optional[str] = None
    capture_state: CaptureState
    version: int

    audio_ref: Optional[str] = None
    audio_duration_seconds: Optional[float] = None
    audio_retention: AudioRetention

    transcript: Optional[str] = None
    transcript_source: TranscriptSource
    transcript_edited_by_user: bool

    title: Optional[str] = None
    title_edited_by_user: bool
    summary: Optional[str] = None
    summary_edited_by_user: bool
    type: ThoughtType
    type_edited_by_user: bool
    tags: List[str]
    tags_edited_by_user: bool

    enrichment_status: EnrichmentStatus
    enrichment_error: Optional[dict] = None
    send_to_ai: bool

    is_deleted: bool
    deleted_at: Optional[datetime] = None
    client_created_at: datetime
    server_created_at: datetime
    updated_at: datetime


class ConflictResponse(BaseModel):
    message: str = "Version conflict detected"
    client_base_version: int
    server_version: int
    server_thought: ThoughtResponse


class ThoughtListResponse(BaseModel):
    items: List[ThoughtResponse]
    next_cursor: Optional[str] = None
    total_count: int
