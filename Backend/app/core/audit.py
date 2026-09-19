import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import AuditLogRecord


async def record_audit_event(
    db: AsyncSession,
    actor_type: str,
    actor_id: str,
    action: str,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLogRecord:
    """
    Appends an immutable audit log entry into the database.
    """
    log_entry = AuditLogRecord(
        id=str(uuid.uuid4()),
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        target_id=target_id,
        details=details or {},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    await db.flush()
    return log_entry
