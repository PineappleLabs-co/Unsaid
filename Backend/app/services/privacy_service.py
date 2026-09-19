from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.config import settings
from app.models.entities import UserRecord, ThoughtRecord, DeviceSessionRecord, EntitlementRecord
from app.schemas.privacy import DeleteAccountResponse, RestoreAccountResponse, DataExportPackage
from app.schemas.thought import ThoughtResponse
from app.core.security import ActorContext
from app.core.audit import record_audit_event


class PrivacyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_user_data(self, actor: ActorContext) -> DataExportPackage:
        """
        Exports all captures, metadata, transcripts, and account info as JSON.
        """
        user_id = actor.user_id or actor.device_id

        # Query all thoughts
        query = select(ThoughtRecord).where(
            ThoughtRecord.user_id == actor.user_id if actor.user_id else ThoughtRecord.device_id == actor.device_id
        ).order_by(ThoughtRecord.client_created_at.desc())
        thoughts_result = await self.db.execute(query)
        thoughts = list(thoughts_result.scalars().all())

        # Audit log data export
        await record_audit_event(
            db=self.db,
            actor_type="user",
            actor_id=user_id,
            action="data_exported",
            target_id=user_id,
            details={"thought_count": len(thoughts)}
        )
        await self.db.commit()

        return DataExportPackage(
            user_id=user_id,
            email=None,
            plan=actor.plan,
            exported_at=datetime.now(timezone.utc),
            thought_count=len(thoughts),
            thoughts=[ThoughtResponse.model_validate(t) for t in thoughts]
        )

    async def request_account_deletion(self, actor: ActorContext) -> DeleteAccountResponse:
        """
        Soft-deletes user account and schedules hard deletion after 7-day grace period.
        """
        user_id = actor.user_id
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account deletion requires authenticated user identity."
            )

        now = datetime.now(timezone.utc)
        scheduled_hard_delete = now + timedelta(days=settings.ACCOUNT_DELETION_GRACE_DAYS)

        # Get or create user record
        user_query = select(UserRecord).where(UserRecord.id == user_id)
        user = (await self.db.execute(user_query)).scalars().first()
        if not user:
            user = UserRecord(id=user_id)
            self.db.add(user)

        user.is_deleted = True
        user.deleted_at = now
        user.hard_delete_scheduled_at = scheduled_hard_delete

        # Mark user's thoughts as soft deleted
        await self.db.execute(
            update(ThoughtRecord)
            .where(ThoughtRecord.user_id == user_id)
            .values(is_deleted=True, deleted_at=now, updated_at=now)
        )

        # Log audit entry
        await record_audit_event(
            db=self.db,
            actor_type="user",
            actor_id=user_id,
            action="account_delete_requested",
            target_id=user_id,
            details={
                "grace_days": settings.ACCOUNT_DELETION_GRACE_DAYS,
                "hard_delete_scheduled_at": scheduled_hard_delete.isoformat()
            }
        )

        await self.db.commit()

        return DeleteAccountResponse(
            user_id=user_id,
            is_deleted=True,
            deleted_at=now,
            grace_period_days=settings.ACCOUNT_DELETION_GRACE_DAYS,
            hard_delete_scheduled_at=scheduled_hard_delete,
            message=f"Account scheduled for permanent deletion in {settings.ACCOUNT_DELETION_GRACE_DAYS} days. You can restore it anytime before that."
        )

    async def restore_account(self, actor: ActorContext) -> RestoreAccountResponse:
        """
        Restores a soft-deleted account within the 7-day grace window.
        """
        user_id = actor.user_id
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account restoration requires authenticated user identity."
            )

        user_query = select(UserRecord).where(UserRecord.id == user_id)
        user = (await self.db.execute(user_query)).scalars().first()
        if not user or not user.is_deleted:
            return RestoreAccountResponse(
                user_id=user_id,
                is_restored=True,
                message="Account is active."
            )

        user.is_deleted = False
        user.deleted_at = None
        user.hard_delete_scheduled_at = None

        # Restore thoughts
        await self.db.execute(
            update(ThoughtRecord)
            .where(ThoughtRecord.user_id == user_id)
            .values(is_deleted=False, deleted_at=None, updated_at=datetime.now(timezone.utc))
        )

        await record_audit_event(
            db=self.db,
            actor_type="user",
            actor_id=user_id,
            action="account_restored",
            target_id=user_id
        )

        await self.db.commit()
        return RestoreAccountResponse(
            user_id=user_id,
            is_restored=True,
            message="Account successfully restored."
        )
