import os
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
    status,
    BackgroundTasks,
)
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings
from app.schemas.thought import (
    ThoughtCreate,
    ThoughtUpdate,
    ThoughtResponse,
    ThoughtListResponse,
)
from app.repositories.base import ThoughtRepository
from app.services.thought_service import ThoughtService
from app.services.enrichment_service import EnrichmentService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/thoughts", tags=["Thoughts"])


async def _run_background_enrichment(thought_id: str, actor: ActorContext, db_session_factory):
    async with db_session_factory() as session:
        repo = ThoughtRepository(session)
        thought = await repo.get_by_id(thought_id, actor=actor)
        if thought:
            enrichment_service = EnrichmentService(session)
            await enrichment_service.enrich_thought(thought, actor)


@router.post("", response_model=ThoughtResponse, status_code=status.HTTP_201_CREATED)
async def create_thought(
    payload: ThoughtCreate,
    background_tasks: BackgroundTasks,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Idempotently insets a thought keyed on client UUID.
    Triggers AI enrichment in the background if capture_state == 'committed'.
    """
    from app.database import AsyncSessionLocal
    service = ThoughtService(db)
    thought, created = await service.ingest_thought(payload, actor)

    if created and thought.send_to_ai and thought.capture_state == "committed":
        background_tasks.add_task(_run_background_enrichment, thought.id, actor, AsyncSessionLocal)

    return ThoughtResponse.model_validate(thought)


@router.post("/{thought_id}/audio", response_model=ThoughtResponse)
async def upload_audio(
    thought_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts multipart audio upload, runs transcription pipeline, and triggers enrichment.
    """
    from app.database import AsyncSessionLocal
    repo = ThoughtRepository(db)
    thought = await repo.get_by_id(thought_id, actor=actor)
    if not thought:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thought {thought_id} not found."
        )

    # Save audio temporarily
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    file_path = os.path.join(settings.STORAGE_DIR, f"{thought_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Perform transcription (Groq Whisper or mock fallback)
    transcription_text = ""
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            with open(file_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    file=(file.filename, audio_file.read()),
                    model=settings.GROQ_WHISPER_MODEL,
                    response_format="text"
                )
                transcription_text = str(transcription)
        except Exception as exc:
            transcription_text = f"Voice recording ({file.filename})"
    else:
        transcription_text = f"Transcribed note from audio recording ({file.filename})"

    # Update thought transcript
    thought.transcript = transcription_text
    thought.transcript_source = "server"
    thought.audio_ref = file_path if thought.audio_retention == "keep" else None
    thought.version += 1
    thought.updated_at = datetime.now(timezone.utc)

    # Data minimization: delete audio file if retention is delete_after_transcription
    if thought.audio_retention == "delete_after_transcription" and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    await db.commit()
    await db.refresh(thought)

    if thought.send_to_ai and thought.capture_state == "committed":
        background_tasks.add_task(_run_background_enrichment, thought.id, actor, AsyncSessionLocal)

    return ThoughtResponse.model_validate(thought)


@router.get("", response_model=ThoughtListResponse)
async def list_thoughts(
    cursor: Optional[str] = Query(None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(50, ge=1, le=100),
    type: Optional[str] = Query(None, description="Filter by thought category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    include_deleted: bool = Query(False, description="Include soft-deleted items"),
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Paged inbox feed filtered by category chips or tags with cursor pagination.
    """
    repo = ThoughtRepository(db)
    cursor_dt = datetime.fromisoformat(cursor) if cursor else None
    items, next_cursor, total_count = await repo.list_thoughts(
        actor=actor,
        cursor=cursor_dt,
        limit=limit,
        type_filter=type,
        tag_filter=tag,
        include_deleted=include_deleted
    )

    return ThoughtListResponse(
        items=[ThoughtResponse.model_validate(t) for t in items],
        next_cursor=next_cursor,
        total_count=total_count
    )


@router.get("/{thought_id}", response_model=ThoughtResponse)
async def get_thought(
    thought_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches single thought detail.
    """
    repo = ThoughtRepository(db)
    thought = await repo.get_by_id(thought_id, actor=actor)
    if not thought:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thought {thought_id} not found."
        )
    return ThoughtResponse.model_validate(thought)


@router.patch("/{thought_id}", response_model=ThoughtResponse)
async def update_thought(
    thought_id: str,
    payload: ThoughtUpdate,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates thought fields with optimistic concurrency control (base_version check).
    """
    service = ThoughtService(db)
    thought = await service.update_thought(thought_id, payload, actor)
    return ThoughtResponse.model_validate(thought)


@router.delete("/{thought_id}", response_model=ThoughtResponse)
async def delete_thought(
    thought_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft-deletes thought (can be undone with /restore).
    """
    service = ThoughtService(db)
    thought = await service.soft_delete_thought(thought_id, actor)
    return ThoughtResponse.model_validate(thought)


@router.post("/{thought_id}/restore", response_model=ThoughtResponse)
async def restore_thought(
    thought_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Restores a soft-deleted thought.
    """
    service = ThoughtService(db)
    thought = await service.restore_thought(thought_id, actor)
    return ThoughtResponse.model_validate(thought)
