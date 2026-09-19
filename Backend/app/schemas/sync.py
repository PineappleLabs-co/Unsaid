from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.thought import ThoughtResponse, ThoughtCreate, ThoughtUpdate


class SyncIncomingItem(BaseModel):
    id: str
    create_data: Optional[ThoughtCreate] = None
    update_data: Optional[ThoughtUpdate] = None


class SyncRequest(BaseModel):
    last_sync_timestamp: Optional[datetime] = None
    client_changes: List[SyncIncomingItem] = []


class SyncConflictItem(BaseModel):
    thought_id: str
    client_base_version: int
    server_version: int
    server_thought: ThoughtResponse


class SyncResponse(BaseModel):
    server_time: datetime
    updated_thoughts: List[ThoughtResponse]
    conflicts: List[SyncConflictItem] = []
    has_more: bool = False
    next_sync_token: str
