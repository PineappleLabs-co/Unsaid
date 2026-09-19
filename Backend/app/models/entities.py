from datetime import datetime, timezone
import json
from typing import List, Optional, Any
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRecord(Base):
    __tablename__ = "users"

    id = Column(String(128), primary_key=True)
    email = Column(String(255), nullable=True)
    plan = Column(String(32), default="free", nullable=False)
    revenuecat_customer_id = Column(String(128), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    hard_delete_scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class DeviceSessionRecord(Base):
    __tablename__ = "device_sessions"

    device_id = Column(String(128), primary_key=True)
    user_id = Column(String(128), ForeignKey("users.id"), nullable=True)
    daily_enrichment_count = Column(Integer, default=0, nullable=False)
    weekly_enrichment_count = Column(Integer, default=0, nullable=False)
    daily_reset_date = Column(String(10), nullable=True)
    weekly_reset_week = Column(String(10), nullable=True)
    last_active_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class ThoughtRecord(Base):
    __tablename__ = "thoughts"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(128), ForeignKey("users.id"), nullable=True, index=True)
    device_id = Column(String(128), nullable=False, index=True)
    raw_text = Column(Text, nullable=True)
    capture_state = Column(String(32), default="committed", nullable=False)
    version = Column(Integer, default=1, nullable=False)

    audio_ref = Column(String(512), nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    audio_retention = Column(String(32), default="delete_after_transcription", nullable=False)

    transcript = Column(Text, nullable=True)
    transcript_source = Column(String(32), default="server", nullable=False)
    transcript_edited_by_user = Column(Boolean, default=False, nullable=False)

    title = Column(String(255), nullable=True)
    title_edited_by_user = Column(Boolean, default=False, nullable=False)
    summary = Column(Text, nullable=True)
    summary_edited_by_user = Column(Boolean, default=False, nullable=False)
    type = Column(String(64), default="other", nullable=False)
    type_edited_by_user = Column(Boolean, default=False, nullable=False)
    _tags = Column("tags", Text, default="[]", nullable=False)
    tags_edited_by_user = Column(Boolean, default=False, nullable=False)

    enrichment_status = Column(String(32), default="pending", nullable=False)
    _enrichment_error = Column("enrichment_error", Text, nullable=True)
    send_to_ai = Column(Boolean, default=True, nullable=False)

    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    client_created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    server_created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False, index=True)

    @property
    def tags(self) -> List[str]:
        if not self._tags:
            return []
        try:
            return json.loads(self._tags)
        except Exception:
            return []

    @tags.setter
    def tags(self, value: List[str]) -> None:
        self._tags = json.dumps(value if value is not None else [])

    @property
    def enrichment_error(self) -> Optional[dict]:
        if not self._enrichment_error:
            return None
        try:
            return json.loads(self._enrichment_error)
        except Exception:
            return None

    @enrichment_error.setter
    def enrichment_error(self, value: Optional[dict]) -> None:
        self._enrichment_error = json.dumps(value) if value is not None else None


class EntitlementRecord(Base):
    __tablename__ = "entitlements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id"), nullable=False, index=True)
    entitlement_id = Column(String(64), default="pro", nullable=False)
    status = Column(String(32), default="active", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class ProcessedWebhookRecord(Base):
    __tablename__ = "processed_webhooks"

    event_id = Column(String(128), primary_key=True)
    event_type = Column(String(64), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class AuditLogRecord(Base):
    __tablename__ = "audit_log"

    id = Column(String(64), primary_key=True)
    actor_type = Column(String(32), nullable=False)
    actor_id = Column(String(128), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    target_id = Column(String(128), nullable=True)
    _details = Column("details", Text, default="{}", nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    @property
    def details(self) -> dict:
        if not self._details:
            return {}
        try:
            return json.loads(self._details)
        except Exception:
            return {}

    @details.setter
    def details(self, value: dict) -> None:
        self._details = json.dumps(value if value is not None else {})


class AITelemetryRecord(Base):
    __tablename__ = "ai_telemetry"

    id = Column(String(64), primary_key=True)
    thought_id: Optional[str] = Column(String(64), nullable=True, index=True)
    actor_id: str = Column(String(128), nullable=False, index=True)
    provider: str = Column(String(64), nullable=False)
    model: str = Column(String(128), nullable=False)
    prompt_version: str = Column(String(32), default="v1", nullable=False)
    input_tokens: int = Column(Integer, default=0, nullable=False)
    output_tokens: int = Column(Integer, default=0, nullable=False)
    latency_ms: int = Column(Integer, default=0, nullable=False)
    estimated_cost_usd: Float = Column(Float, default=0.0, nullable=False)
    status: str = Column(String(32), default="success", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)


class TranscriptionJobRecord(Base):
    __tablename__ = "transcription_jobs"

    id = Column(String(64), primary_key=True)
    thought_id = Column(String(64), nullable=False, index=True)
    audio_path = Column(String(512), nullable=False)
    status = Column(String(32), default="queued", nullable=False)  # "queued" | "processing" | "complete" | "failed"
    transcript = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


Index("idx_thoughts_user_updated", ThoughtRecord.user_id, ThoughtRecord.updated_at)
Index("idx_thoughts_device_updated", ThoughtRecord.device_id, ThoughtRecord.updated_at)
