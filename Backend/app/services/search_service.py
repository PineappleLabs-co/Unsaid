from typing import List, Tuple
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import ThoughtRecord
from app.schemas.search import SearchResponse, SearchResultItem
from app.schemas.thought import ThoughtResponse
from app.core.security import ActorContext


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_thoughts(
        self,
        query: str,
        actor: ActorContext,
        mode: str = "keyword",
        limit: int = 50
    ) -> SearchResponse:
        cleaned_query = query.strip().lower()
        if not cleaned_query:
            return SearchResponse(query=query, mode=mode, total_matches=0, results=[])

        tokens = cleaned_query.split()

        # Build base filter
        conditions = [ThoughtRecord.is_deleted.is_(False)]
        if actor.user_id:
            conditions.append(
                or_(
                    ThoughtRecord.user_id == actor.user_id,
                    and_(ThoughtRecord.user_id.is_(None), ThoughtRecord.device_id == actor.device_id)
                )
            )
        else:
            conditions.append(ThoughtRecord.device_id == actor.device_id)

        stmt = select(ThoughtRecord).where(and_(*conditions))
        records = (await self.db.execute(stmt)).scalars().all()

        scored_items: List[Tuple[float, ThoughtRecord]] = []

        for item in records:
            score = 0.0
            raw_text = (item.raw_text or "").lower()
            transcript = (item.transcript or "").lower()
            title = (item.title or "").lower()
            summary = (item.summary or "").lower()
            tags = [t.lower() for t in item.tags]

            for token in tokens:
                if token in title:
                    score += 4.0
                if any(token in t for t in tags):
                    score += 3.0
                if token in summary:
                    score += 2.0
                if token in raw_text or token in transcript:
                    score += 1.5

            if score > 0.0:
                normalized_score = min(1.0, round(score / (len(tokens) * 4.0), 2))
                scored_items.append((normalized_score, item))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        top_results = scored_items[:limit]

        results = [
            SearchResultItem(
                thought_id=item.id,
                match_type="keyword",
                score=score,
                thought=ThoughtResponse.model_validate(item)
            )
            for score, item in top_results
        ]

        return SearchResponse(
            query=query,
            mode=mode,
            total_matches=len(results),
            results=results
        )
