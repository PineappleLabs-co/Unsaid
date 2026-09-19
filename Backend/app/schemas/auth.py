from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DeviceSessionInit(BaseModel):
    device_id: str


class DeviceSessionResponse(BaseModel):
    device_id: str
    user_id: Optional[str] = None
    daily_enrichments_used: int
    daily_enrichments_remaining: int
    weekly_enrichments_used: int
    weekly_enrichments_remaining: int
    plan: str
    last_active_at: datetime


class MigrateSessionRequest(BaseModel):
    device_id: str


class MigrateSessionResponse(BaseModel):
    migrated_thought_count: int
    user_id: str
    message: str
