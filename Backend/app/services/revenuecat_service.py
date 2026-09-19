import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.entities import ProcessedWebhookRecord, UserRecord
from app.schemas.webhook import RevenueCatWebhookPayload, WebhookResponse
from app.repositories.base import EntitlementRepository
from app.core.audit import record_audit_event

logger = logging.getLogger(__name__)


class RevenueCatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.entitlement_repo = EntitlementRepository(db)

    async def process_webhook(self, payload: RevenueCatWebhookPayload) -> WebhookResponse:
        """
        Processes and deduplicates RevenueCat webhook events.
        Maps lifecycle events to entitlement states (active, in_grace_period, in_billing_retry, expired).
        """
        event = payload.event
        event_id = event.id

        # Deduplicate event
        check_query = select(ProcessedWebhookRecord).where(ProcessedWebhookRecord.event_id == event_id)
        existing = (await self.db.execute(check_query)).scalars().first()
        if existing:
            return WebhookResponse(
                status="ignored_duplicate",
                event_id=event_id,
                message="Event already processed."
            )

        user_id = event.app_user_id
        event_type = event.type.upper()

        expires_at = None
        if event.expiration_at_ms:
            expires_at = datetime.fromtimestamp(event.expiration_at_ms / 1000.0, tz=timezone.utc)

        # Map RevenueCat event to entitlement status
        new_status = "active"
        if event_type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]:
            new_status = "active"
        elif event_type in ["BILLING_ISSUE"]:
            new_status = "in_grace_period"
        elif event_type in ["EXPIRATION"]:
            new_status = "expired"
        elif event_type in ["CANCELLATION"]:
            # Cancellation still keeps active status until expiration_at_ms
            new_status = "active" if expires_at and expires_at > datetime.now(timezone.utc) else "expired"
        else:
            new_status = "active"

        # Update entitlement record
        await self.entitlement_repo.set_entitlement(
            user_id=user_id,
            status=new_status,
            expires_at=expires_at
        )

        # Record processed webhook
        processed = ProcessedWebhookRecord(
            event_id=event_id,
            event_type=event_type,
            processed_at=datetime.now(timezone.utc)
        )
        self.db.add(processed)

        # Log to immutable audit log
        await record_audit_event(
            db=self.db,
            actor_type="system",
            actor_id="revenuecat_webhook",
            action="entitlement_updated",
            target_id=user_id,
            details={
                "event_id": event_id,
                "event_type": event_type,
                "new_status": new_status,
                "expires_at": expires_at.isoformat() if expires_at else None
            }
        )

        await self.db.commit()
        return WebhookResponse(
            status="success",
            event_id=event_id,
            message=f"Processed {event_type}, user {user_id} set to {new_status}"
        )
