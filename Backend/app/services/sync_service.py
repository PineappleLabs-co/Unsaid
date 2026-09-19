from datetime import datetime, timezone
from typing import List, Tuple
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import ThoughtRecord, DeviceSessionRecord
from app.schemas.sync import SyncRequest, SyncResponse, SyncConflictItem
from app.schemas.thought import ThoughtResponse
from app.repositories.base import ThoughtRepository
from app.services.thought_service import ThoughtService
from app.core.security import ActorContext


class SyncService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ThoughtRepository(db)
        self.thought_service = ThoughtService(db)

    async def execute_sync(self, request: SyncRequest, actor: ActorContext) -> SyncResponse:
        """
        Executes bidirectional delta synchronization.
        1. Ingests or updates incoming client items with conflict detection.
        2. Retrieves all thoughts modified after request.last_sync_timestamp.
        """
        conflicts: List[SyncConflictItem] = []

        # Process incoming client batch
        for item in request.client_changes:
            if item.create_data:
                await self.thought_service.ingest_thought(item.create_data, actor)
            elif item.update_data:
                try:
                    await self.thought_service.update_thought(item.id, item.update_data, actor)
                except Exception as exc:
                    # If conflict or failure, fetch current server state and report
                    server_thought = await self.repo.get_by_id(item.id, actor=actor)
                    if server_thought:
                        conflicts.append(
                            SyncConflictItem(
                                thought_id=item.id,
                                client_base_version=item.update_data.base_version,
                                server_version=server_thought.version,
                                server_thought=ThoughtResponse.model_validate(server_thought)
                            )
                        )

        # Retrieve server updates since client's last sync
        updated_records = await self.repo.get_changes_since(
            actor=actor,
            since_timestamp=request.last_sync_timestamp
        )

        now = datetime.now(timezone.utc)
        return SyncResponse(
            server_time=now,
            updated_thoughts=[ThoughtResponse.model_validate(t) for t in updated_records],
            conflicts=conflicts,
            has_more=False,
            next_sync_token=now.isoformat()
        )

    async def migrate_anonymous_session(self, device_id: str, user_id: str) -> int:
        """
        Migrates all thoughts created by an anonymous device ID to the authenticated user ID.
        """
        stmt = (
            update(ThoughtRecord)
            .where(ThoughtRecord.device_id == device_id, ThoughtRecord.user_id.is_(None))
            .values(user_id=user_id, updated_at=datetime.now(timezone.utc))
        )
        result = await self.db.execute(stmt)
        migrated_count = result.rowcount or 0

        # Update device session linkage
        session_stmt = (
            update(DeviceSessionRecord)
            .where(DeviceSessionRecord.device_id == device_id)
            .values(user_id=user_id, last_active_at=datetime.now(timezone.utc))
        )
        await self.db.execute(session_stmt)

        await self.db.commit()
        return migrated_count
