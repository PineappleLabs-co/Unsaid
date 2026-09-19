from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, update, delete, and_, or_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import (
    ThoughtRecord,
    DeviceSessionRecord,
    UserRecord,
    EntitlementRecord,
    ProcessedWebhookRecord,
    AuditLogRecord,
)
from app.core.security import ActorContext


class ThoughtRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, thought_id: str, actor: Optional[ActorContext] = None) -> Optional[ThoughtRecord]:
        query = select(ThoughtRecord).where(ThoughtRecord.id == thought_id)
        if actor:
            if actor.user_id:
                query = query.where(
                    or_(
                        ThoughtRecord.user_id == actor.user_id,
                        and_(ThoughtRecord.user_id.is_(None), ThoughtRecord.device_id == actor.device_id)
                    )
                )
            else:
                query = query.where(ThoughtRecord.device_id == actor.device_id)

        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_thoughts(
        self,
        actor: ActorContext,
        cursor: Optional[datetime] = None,
        limit: int = 50,
        type_filter: Optional[str] = None,
        tag_filter: Optional[str] = None,
        include_deleted: bool = False
    ) -> Tuple[List[ThoughtRecord], Optional[str], int]:
        conditions = []

        if actor.user_id:
            conditions.append(
                or_(
                    ThoughtRecord.user_id == actor.user_id,
                    and_(ThoughtRecord.user_id.is_(None), ThoughtRecord.device_id == actor.device_id)
                )
            )
        else:
            conditions.append(ThoughtRecord.device_id == actor.device_id)

        if not include_deleted:
            conditions.append(ThoughtRecord.is_deleted.is_(False))

        if type_filter and type_filter != "all":
            conditions.append(ThoughtRecord.type == type_filter)

        if cursor:
            conditions.append(ThoughtRecord.updated_at < cursor)

        # Count total items matching base criteria
        base_conditions = [c for c in conditions if c is not None and (cursor is None or c is not (ThoughtRecord.updated_at < cursor))]
        count_query = select(func.count(ThoughtRecord.id)).where(and_(*base_conditions))
        total_count_res = await self.db.execute(count_query)
        total_count = total_count_res.scalar() or 0

        # Query items
        query = (
            select(ThoughtRecord)
            .where(and_(*conditions))
            .order_by(desc(ThoughtRecord.updated_at))
            .limit(limit + 1)
        )
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        next_cursor = None
        if len(items) > limit:
            items = items[:limit]
            next_cursor = items[-1].updated_at.isoformat()

        # In-memory filter for tags if specified (since tags are JSON string)
        if tag_filter:
            items = [item for item in items if tag_filter.lower() in [t.lower() for t in item.tags]]

        return items, next_cursor, total_count

    async def create(self, thought: ThoughtRecord) -> ThoughtRecord:
        self.db.add(thought)
        await self.db.flush()
        return thought

    async def get_changes_since(
        self,
        actor: ActorContext,
        since_timestamp: Optional[datetime],
        limit: int = 100
    ) -> List[ThoughtRecord]:
        conditions = []
        if actor.user_id:
            conditions.append(
                or_(
                    ThoughtRecord.user_id == actor.user_id,
                    and_(ThoughtRecord.user_id.is_(None), ThoughtRecord.device_id == actor.device_id)
                )
            )
        else:
            conditions.append(ThoughtRecord.device_id == actor.device_id)

        if since_timestamp:
            conditions.append(ThoughtRecord.updated_at > since_timestamp)

        query = select(ThoughtRecord).where(and_(*conditions)).order_by(ThoughtRecord.updated_at.asc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())


class QuotaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_device_session(self, device_id: str, user_id: Optional[str] = None) -> DeviceSessionRecord:
        query = select(DeviceSessionRecord).where(DeviceSessionRecord.device_id == device_id)
        result = await self.db.execute(query)
        session = result.scalars().first()

        now = datetime.now(timezone.utc)
        current_date_str = now.strftime("%Y-%m-%d")
        current_week_str = now.strftime("%Y-%W")

        if not session:
            session = DeviceSessionRecord(
                device_id=device_id,
                user_id=user_id,
                daily_enrichment_count=0,
                weekly_enrichment_count=0,
                daily_reset_date=current_date_str,
                weekly_reset_week=current_week_str,
                last_active_at=now
            )
            self.db.add(session)
            await self.db.flush()
            return session

        # Check daily reset
        if session.daily_reset_date != current_date_str:
            session.daily_enrichment_count = 0
            session.daily_reset_date = current_date_str

        # Check weekly reset
        if session.weekly_reset_week != current_week_str:
            session.weekly_enrichment_count = 0
            session.weekly_reset_week = current_week_str

        if user_id and not session.user_id:
            session.user_id = user_id

        session.last_active_at = now
        await self.db.flush()
        return session

    async def increment_usage(self, session: DeviceSessionRecord) -> None:
        session.daily_enrichment_count += 1
        session.weekly_enrichment_count += 1
        await self.db.flush()


class EntitlementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_entitlement(self, user_id: str) -> Optional[EntitlementRecord]:
        query = select(EntitlementRecord).where(
            EntitlementRecord.user_id == user_id,
            EntitlementRecord.entitlement_id == "pro"
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def set_entitlement(
        self,
        user_id: str,
        status: str,
        expires_at: Optional[datetime] = None
    ) -> EntitlementRecord:
        record = await self.get_user_entitlement(user_id)
        now = datetime.now(timezone.utc)
        if not record:
            record = EntitlementRecord(
                user_id=user_id,
                entitlement_id="pro",
                status=status,
                expires_at=expires_at,
                last_verified_at=now
            )
            self.db.add(record)
        else:
            record.status = status
            record.expires_at = expires_at
            record.last_verified_at = now

        await self.db.flush()
        return record
