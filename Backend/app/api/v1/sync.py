from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.sync import SyncRequest, SyncResponse
from app.services.sync_service import SyncService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/sync", tags=["Cross-Device Sync"])


@router.post("", response_model=SyncResponse)
async def sync_thoughts(
    payload: SyncRequest,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Delta sync endpoint for cross-device synchronization and conflict detection.
    """
    service = SyncService(db)
    return await service.execute_sync(payload, actor)
