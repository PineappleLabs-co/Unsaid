from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.privacy import (
    DataExportPackage,
    DeleteAccountResponse,
    RestoreAccountResponse,
)
from app.services.privacy_service import PrivacyService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/privacy", tags=["Privacy & Compliance"])


@router.get("/export", response_model=DataExportPackage)
async def export_data(
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Exports all personal captures, transcripts, and metadata as a JSON package.
    Satisfies GDPR Article 15/20 and DPDP Data Principal access rights.
    """
    service = PrivacyService(db)
    return await service.export_user_data(actor)


@router.post("/delete-account", response_model=DeleteAccountResponse)
async def delete_account(
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Requests account deletion: initiates immediate soft-delete with a 7-day grace period
    before permanent purge.
    """
    service = PrivacyService(db)
    return await service.request_account_deletion(actor)


@router.post("/restore-account", response_model=RestoreAccountResponse)
async def restore_account(
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Restores a soft-deleted account within the 7-day grace period.
    """
    service = PrivacyService(db)
    return await service.restore_account(actor)
