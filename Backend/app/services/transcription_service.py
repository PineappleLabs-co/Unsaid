import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.entities import TranscriptionJobRecord, ThoughtRecord
from app.schemas.audio import TranscriptionJobResponse
from app.ai.gateway import AIGateway
from app.repositories.base import ThoughtRepository
from app.core.security import ActorContext


class TranscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_gateway = AIGateway(db)

    async def create_job(self, thought_id: str, audio_path: str, actor: ActorContext) -> TranscriptionJobResponse:
        repo = ThoughtRepository(self.db)
        thought = await repo.get_by_id(thought_id, actor=actor)
        if not thought:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Thought {thought_id} not found.")

        job_id = f"job_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        job = TranscriptionJobRecord(
            id=job_id,
            thought_id=thought_id,
            audio_path=audio_path,
            status="queued",
            created_at=now,
            updated_at=now
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)

        return TranscriptionJobResponse(
            job_id=job.id,
            thought_id=job.thought_id,
            status=job.status,
            transcript=job.transcript,
            error=job.error,
            created_at=job.created_at,
            updated_at=job.updated_at
        )

    async def get_job(self, job_id: str) -> TranscriptionJobResponse:
        query = select(TranscriptionJobRecord).where(TranscriptionJobRecord.id == job_id)
        job = (await self.db.execute(query)).scalars().first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Transcription job {job_id} not found.")

        return TranscriptionJobResponse(
            job_id=job.id,
            thought_id=job.thought_id,
            status=job.status,
            transcript=job.transcript,
            error=job.error,
            created_at=job.created_at,
            updated_at=job.updated_at
        )

    async def process_job(self, job_id: str, audio_bytes: bytes, filename: str) -> None:
        query = select(TranscriptionJobRecord).where(TranscriptionJobRecord.id == job_id)
        job = (await self.db.execute(query)).scalars().first()
        if not job:
            return

        job.status = "processing"
        job.updated_at = datetime.now(timezone.utc)
        await self.db.commit()

        try:
            transcript = await self.ai_gateway.transcribe_audio(audio_bytes, filename)
            job.transcript = transcript
            job.status = "complete"

            # Update associated thought
            thought_query = select(ThoughtRecord).where(ThoughtRecord.id == job.thought_id)
            thought = (await self.db.execute(thought_query)).scalars().first()
            if thought and not thought.transcript_edited_by_user:
                thought.transcript = transcript
                thought.transcript_source = "server"
                thought.version += 1
                thought.updated_at = datetime.now(timezone.utc)

        except Exception as exc:
            job.status = "failed"
            job.error = str(exc)

        job.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
