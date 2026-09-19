from typing import List, Optional
from pydantic import BaseModel
from app.schemas.thought import ThoughtResponse


class SearchResultItem(BaseModel):
    thought_id: str
    match_type: str = "keyword"
    score: float
    thought: ThoughtResponse


class SearchResponse(BaseModel):
    query: str
    mode: str = "keyword"
    total_matches: int
    results: List[SearchResultItem]
