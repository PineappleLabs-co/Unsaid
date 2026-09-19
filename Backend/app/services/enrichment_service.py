import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.models.entities import ThoughtRecord
from app.schemas.enrichment import GroqEnrichmentResult
from app.repositories.base import QuotaRepository, EntitlementRepository
from app.core.security import ActorContext
from app.ai.gateway import AIGateway

logger = logging.getLogger(__name__)


class EnrichmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.quota_repo = QuotaRepository(db)
        self.entitlement_repo = EntitlementRepository(db)
        self.ai_gateway = AIGateway(db)

    async def check_and_reserve_quota(self, actor: ActorContext) -> bool:
        if actor.user_id:
            entitlement = await self.entitlement_repo.get_user_entitlement(actor.user_id)
            if entitlement and entitlement.status in ["active", "in_grace_period"]:
                return True

        session = await self.quota_repo.get_or_create_device_session(
            device_id=actor.device_id,
            user_id=actor.user_id
        )

        if (
            session.daily_enrichment_count >= settings.FREE_TIER_DAILY_LIMIT
            or session.weekly_enrichment_count >= settings.FREE_TIER_WEEKLY_LIMIT
        ):
            return False

        return True

    async def enrich_thought(self, thought: ThoughtRecord, actor: ActorContext, force_enable_ai: bool = False) -> ThoughtRecord:
        if force_enable_ai:
            thought.send_to_ai = True

        if not thought.send_to_ai:
            thought.enrichment_status = "disabled"
            await self.db.commit()
            return thought

        allowed = await self.check_and_reserve_quota(actor)
        if not allowed:
            thought.enrichment_status = "failed"
            thought.enrichment_error = {
                "code": "QUOTA_EXCEEDED",
                "message": f"Free tier quota reached ({settings.FREE_TIER_DAILY_LIMIT}/day, {settings.FREE_TIER_WEEKLY_LIMIT}/week). Upgrade to Pro for unlimited AI organization."
            }
            await self.db.commit()
            return thought

        thought.enrichment_status = "processing"
        await self.db.commit()

        input_text = thought.raw_text or thought.transcript
        if not input_text or not input_text.strip():
            thought.enrichment_status = "failed"
            thought.enrichment_error = {
                "code": "EMPTY_INPUT",
                "message": "No text or transcript available for enrichment."
            }
            await self.db.commit()
            return thought

        try:
            actor_identifier = actor.user_id or actor.device_id
            result = await self.ai_gateway.enrich_thought(
                text=input_text,
                actor_id=actor_identifier,
                thought_id=thought.id
            )

            # Additive non-destructive merge
            if not thought.title_edited_by_user:
                thought.title = result.title
            if not thought.summary_edited_by_user:
                thought.summary = result.summary
            if not thought.type_edited_by_user:
                thought.type = result.type
            if not thought.tags_edited_by_user:
                thought.tags = result.tags

            thought.enrichment_status = "complete"
            thought.enrichment_error = None
            thought.version += 1
            thought.updated_at = datetime.now(timezone.utc)

            # Deduct quota upon success
            session = await self.quota_repo.get_or_create_device_session(
                device_id=actor.device_id,
                user_id=actor.user_id
            )
            await self.quota_repo.increment_usage(session)

            await self.db.commit()
            await self.db.refresh(thought)
            return thought

        except Exception as exc:
            logger.error(f"Enrichment processing error for thought {thought.id}: {exc}")
            thought.enrichment_status = "failed"
            thought.enrichment_error = {
                "code": "ENRICHMENT_ERROR",
                "message": str(exc)
            }
            thought.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(thought)
            return thought
