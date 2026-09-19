from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService
from app.core.security import get_current_actor, ActorContext

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
async def search_thoughts(
    q: str = Query(..., min_length=1, description="Search keyword string"),
    mode: str = Query("keyword", description="Search mode: keyword (P0) or semantic (P2)"),
    limit: int = Query(50, ge=1, le=100),
    actor: ActorContext = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    """
    Ranked keyword search across title, tags, summary, and transcript/raw text.
    """
    service = SearchService(db)
    return await service.search_thoughts(q, actor, mode=mode, limit=limit)
