from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.enrichment import (
    EnrichmentStatusResponse,
    RetryEnrichmentResponse,
)
from app.schemas.thought import ThoughtResponse
from app.repositories.base import ThoughtRepository
from app.services.enrichment_service import EnrichmentService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/enrichment", tags=["AI Enrichment"])


@router.get("/{thought_id}/status", response_model=EnrichmentStatusResponse)
async def get_enrichment_status(
    thought_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Checks real-time enrichment status of a thought.
    """
    repo = ThoughtRepository(db)
    thought = await repo.get_by_id(thought_id, actor=actor)
    if not thought:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thought {thought_id} not found."
        )

    return EnrichmentStatusResponse(
        thought_id=thought.id,
        enrichment_status=thought.enrichment_status,
        title=thought.title,
        summary=thought.summary,
        type=thought.type,
        tags=thought.tags,
        error=thought.enrichment_error,
        is_partial=thought.enrichment_status == "partial"
    )


@router.post("/{thought_id}/retry", response_model=ThoughtResponse)
async def retry_enrichment(
    thought_id: str,
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually retries AI enrichment on a failed or partial thought.
    """
    repo = ThoughtRepository(db)
    thought = await repo.get_by_id(thought_id, actor=actor)
    if not thought:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thought {thought_id} not found."
        )

    enrichment_service = EnrichmentService(db)
    updated = await enrichment_service.enrich_thought(thought, actor, force_enable_ai=True)
    return ThoughtResponse.model_validate(updated)
