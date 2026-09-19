from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import ThoughtRecord
from app.schemas.thought import ThoughtCreate, ThoughtUpdate, ThoughtResponse
from app.repositories.base import ThoughtRepository
from app.core.security import ActorContext


class ThoughtService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ThoughtRepository(db)

    async def ingest_thought(self, payload: ThoughtCreate, actor: ActorContext) -> Tuple[ThoughtRecord, bool]:
        """
        Idempotently creates a thought. If it already exists (by UUID), returns existing.
        """
        existing = await self.repo.get_by_id(payload.id, actor=None)
        if existing:
            # Check ownership
            if existing.device_id != actor.device_id and existing.user_id != actor.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot modify a thought belonging to another identity."
                )
            return existing, False

        now = datetime.now(timezone.utc)
        thought = ThoughtRecord(
            id=payload.id,
            user_id=actor.user_id,
            device_id=actor.device_id,
            raw_text=payload.raw_text,
            capture_state=payload.capture_state,
            version=1,
            audio_ref=payload.audio_ref,
            audio_duration_seconds=payload.audio_duration_seconds,
            audio_retention=payload.audio_retention,
            transcript=payload.transcript,
            transcript_source=payload.transcript_source,
            transcript_edited_by_user=False,
            title=None,
            title_edited_by_user=False,
            summary=None,
            summary_edited_by_user=False,
            type="other",
            type_edited_by_user=False,
            tags=[],
            tags_edited_by_user=False,
            enrichment_status="pending" if (payload.send_to_ai and payload.capture_state == "committed") else "disabled",
            send_to_ai=payload.send_to_ai,
            is_deleted=False,
            client_created_at=payload.client_created_at or now,
            server_created_at=now,
            updated_at=now,
        )
        await self.repo.create(thought)
        await self.db.commit()
        await self.db.refresh(thought)
        return thought, True

    async def update_thought(self, thought_id: str, payload: ThoughtUpdate, actor: ActorContext) -> ThoughtRecord:
        """
        Optimistic concurrency control update.
        Fails with 409 Conflict if base_version != thought.version.
        """
        thought = await self.repo.get_by_id(thought_id, actor=actor)
        if not thought:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Thought {thought_id} not found."
            )

        if thought.version != payload.base_version:
            # Conflict detected! Return 409 with full server state
            server_dump = ThoughtResponse.model_validate(thought).model_dump(mode="json")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": f"Version conflict: client base_version {payload.base_version} != server version {thought.version}",
                    "client_base_version": payload.base_version,
                    "server_version": thought.version,
                    "server_thought": server_dump
                }
            )

        # Apply updates and track user edits
        if payload.raw_text is not None:
            thought.raw_text = payload.raw_text

        if payload.capture_state is not None:
            thought.capture_state = payload.capture_state

        if payload.transcript is not None:
            thought.transcript = payload.transcript
            thought.transcript_edited_by_user = True

        if payload.title is not None:
            thought.title = payload.title
            thought.title_edited_by_user = True

        if payload.summary is not None:
            thought.summary = payload.summary
            thought.summary_edited_by_user = True

        if payload.type is not None:
            thought.type = payload.type
            thought.type_edited_by_user = True

        if payload.tags is not None:
            thought.tags = payload.tags
            thought.tags_edited_by_user = True

        if payload.send_to_ai is not None:
            thought.send_to_ai = payload.send_to_ai

        if payload.audio_retention is not None:
            thought.audio_retention = payload.audio_retention

        thought.version += 1
        thought.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(thought)
        return thought

    async def soft_delete_thought(self, thought_id: str, actor: ActorContext) -> ThoughtRecord:
        thought = await self.repo.get_by_id(thought_id, actor=actor)
        if not thought:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Thought {thought_id} not found."
            )

        thought.is_deleted = True
        thought.deleted_at = datetime.now(timezone.utc)
        thought.version += 1
        thought.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(thought)
        return thought

    async def restore_thought(self, thought_id: str, actor: ActorContext) -> ThoughtRecord:
        thought = await self.repo.get_by_id(thought_id, actor=actor)
        if not thought:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Thought {thought_id} not found."
            )

        thought.is_deleted = False
        thought.deleted_at = None
        thought.version += 1
        thought.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(thought)
        return thought
