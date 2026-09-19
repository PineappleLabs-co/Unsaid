import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, AsyncSessionLocal
from app.schemas.audio import TranscriptionJobResponse
from app.services.transcription_service import TranscriptionService
from app.core.security import get_current_actor, ActorContext
from app.config import settings

router = APIRouter(prefix="/audio", tags=["Audio & Transcription"])


async def _run_job_worker(job_id: str, audio_bytes: bytes, filename: str):
    async with AsyncSessionLocal() as session:
        service = TranscriptionService(session)
        await service.process_job(job_id, audio_bytes, filename)


@router.post("/transcriptions", response_model=TranscriptionJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_transcription_job(
    background_tasks: BackgroundTasks,
    thought_id: str = Form(...),
    file: UploadFile = File(...),
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits an audio recording for asynchronous transcription processing (§18).
    """
    audio_bytes = await file.read()
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    file_path = os.path.join(settings.STORAGE_DIR, f"{thought_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(audio_bytes)

    service = TranscriptionService(db)
    job_res = await service.create_job(thought_id=thought_id, audio_path=file_path, actor=actor)

    background_tasks.add_task(_run_job_worker, job_res.job_id, audio_bytes, file.filename)
    return job_res


@router.get("/transcriptions/{job_id}", response_model=TranscriptionJobResponse)
async def get_transcription_job(
    job_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Polls the status of an asynchronous transcription job (§18).
    """
    service = TranscriptionService(db)
    return await service.get_job(job_id)
