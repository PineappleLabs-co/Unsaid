import os
import logging
from datetime import datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import UserRecord, ThoughtRecord, DeviceSessionRecord, EntitlementRecord
from app.core.audit import record_audit_event

logger = logging.getLogger(__name__)


class HardPurgeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_scheduled_hard_purge(self) -> int:
        """
        Permanently purges user data whose 7-day grace period has expired.
        """
        now = datetime.now(timezone.utc)
        query = select(UserRecord).where(
            UserRecord.is_deleted.is_(True),
            UserRecord.hard_delete_scheduled_at <= now
        )
        expired_users = (await self.db.execute(query)).scalars().all()
        purged_count = 0

        for user in expired_users:
            user_id = user.id
            logger.info(f"Executing permanent hard delete for user {user_id}")

            # 1. Fetch thoughts to delete associated audio files
            t_query = select(ThoughtRecord).where(ThoughtRecord.user_id == user_id)
            user_thoughts = (await self.db.execute(t_query)).scalars().all()
            for t in user_thoughts:
                if t.audio_ref and os.path.exists(t.audio_ref):
                    try:
                        os.remove(t.audio_ref)
                    except Exception as e:
                        logger.warning(f"Failed to delete audio file {t.audio_ref}: {e}")

            # 2. Hard delete thoughts
            await self.db.execute(delete(ThoughtRecord).where(ThoughtRecord.user_id == user_id))

            # 3. Hard delete entitlements & sessions
            await self.db.execute(delete(EntitlementRecord).where(EntitlementRecord.user_id == user_id))
            await self.db.execute(delete(DeviceSessionRecord).where(DeviceSessionRecord.user_id == user_id))

            # 4. Hard delete user record
            await self.db.execute(delete(UserRecord).where(UserRecord.id == user_id))

            # 5. Log immutable audit entry
            await record_audit_event(
                db=self.db,
                actor_type="system",
                actor_id="scheduled_hard_purge",
                action="account_hard_deleted",
                target_id=user_id,
                details={"purged_at": now.isoformat(), "thoughts_purged": len(user_thoughts)}
            )
            purged_count += 1

        await self.db.commit()
        return purged_count
