from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import (
    DeviceSessionInit,
    DeviceSessionResponse,
    MigrateSessionRequest,
    MigrateSessionResponse,
)
from app.services.auth_service import AuthService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/auth", tags=["Auth & Sessions"])


@router.get("/session", response_model=DeviceSessionResponse)
async def get_session(
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves current device/user session and quota status.
    """
    service = AuthService(db)
    return await service.get_session_info(actor)


@router.post("/migrate", response_model=MigrateSessionResponse)
async def migrate_anonymous_session(
    payload: MigrateSessionRequest,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Migrates captures from an anonymous device ID to the authenticated user account.
    """
    if not actor.is_authenticated or not actor.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User authentication required to migrate anonymous device data."
        )

    service = AuthService(db)
    return await service.migrate_anonymous_data(payload.device_id, actor)
