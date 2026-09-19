import pytest
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import UserRecord, ThoughtRecord
from app.services.purge_service import HardPurgeService


@pytest.mark.asyncio
async def test_scheduled_hard_purge(db_session: AsyncSession):
    user_id = f"purge-user-{uuid.uuid4().hex[:8]}"
    past_date = datetime.now(timezone.utc) - timedelta(days=8)

    user = UserRecord(
        id=user_id,
        is_deleted=True,
        deleted_at=past_date,
        hard_delete_scheduled_at=past_date
    )
    db_session.add(user)

    thought = ThoughtRecord(
        id=str(uuid.uuid4()),
        user_id=user_id,
        device_id="dev-1",
        raw_text="To be purged forever",
        is_deleted=True,
        deleted_at=past_date
    )
    db_session.add(thought)
    await db_session.commit()

    service = HardPurgeService(db_session)
    purged_count = await service.execute_scheduled_hard_purge()
    assert purged_count >= 1
