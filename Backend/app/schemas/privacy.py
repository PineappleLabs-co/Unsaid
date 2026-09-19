from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.thought import ThoughtResponse


class DeleteAccountResponse(BaseModel):
    user_id: str
    is_deleted: bool
    deleted_at: datetime
    grace_period_days: int
    hard_delete_scheduled_at: datetime
    message: str


class RestoreAccountResponse(BaseModel):
    user_id: str
    is_restored: bool
    message: str


class DataExportPackage(BaseModel):
    user_id: str
    email: Optional[str] = None
    plan: str
    exported_at: datetime
    thought_count: int
    thoughts: List[ThoughtResponse]
