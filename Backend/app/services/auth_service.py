from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.schemas.auth import DeviceSessionResponse, MigrateSessionResponse
from app.repositories.base import QuotaRepository, EntitlementRepository
from app.services.sync_service import SyncService
from app.core.security import ActorContext


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.quota_repo = QuotaRepository(db)
        self.entitlement_repo = EntitlementRepository(db)
        self.sync_service = SyncService(db)

    async def get_session_info(self, actor: ActorContext) -> DeviceSessionResponse:
        session = await self.quota_repo.get_or_create_device_session(
            device_id=actor.device_id,
            user_id=actor.user_id
        )

        plan = "free"
        if actor.user_id:
            entitlement = await self.entitlement_repo.get_user_entitlement(actor.user_id)
            if entitlement and entitlement.status in ["active", "in_grace_period"]:
                plan = "pro"

        daily_used = session.daily_enrichment_count
        weekly_used = session.weekly_enrichment_count

        daily_remaining = max(0, settings.FREE_TIER_DAILY_LIMIT - daily_used) if plan == "free" else 999999
        weekly_remaining = max(0, settings.FREE_TIER_WEEKLY_LIMIT - weekly_used) if plan == "free" else 999999

        return DeviceSessionResponse(
            device_id=session.device_id,
            user_id=session.user_id,
            daily_enrichments_used=daily_used,
            daily_enrichments_remaining=daily_remaining,
            weekly_enrichments_used=weekly_used,
            weekly_enrichments_remaining=weekly_remaining,
            plan=plan,
            last_active_at=session.last_active_at
        )

    async def migrate_anonymous_data(self, device_id: str, actor: ActorContext) -> MigrateSessionResponse:
        if not actor.user_id:
            raise ValueError("Migration requires an authenticated user identity.")

        count = await self.sync_service.migrate_anonymous_session(device_id, actor.user_id)
        return MigrateSessionResponse(
            migrated_thought_count=count,
            user_id=actor.user_id,
            message=f"Successfully migrated {count} thoughts to user account {actor.user_id}"
        )
