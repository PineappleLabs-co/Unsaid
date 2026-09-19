from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings
from app.schemas.webhook import RevenueCatWebhookPayload, WebhookResponse
from app.services.revenuecat_service import RevenueCatService

router = APIRouter(prefix="/webhooks", tags=["Monetization Webhooks"])


@router.post("/revenuecat", response_model=WebhookResponse)
async def revenuecat_webhook(
    payload: RevenueCatWebhookPayload,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives and processes RevenueCat subscription lifecycle webhooks.
    Validates webhook authorization secret and deduplicates events.
    """
    if settings.REVENUECAT_WEBHOOK_SECRET:
        expected = f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"
        if not authorization or authorization != expected:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing webhook secret authorization"
            )

    service = RevenueCatService(db)
    return await service.process_webhook(payload)
