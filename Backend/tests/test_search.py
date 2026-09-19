import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_keyword_search_ranking(client: AsyncClient):
    headers = {"X-Device-ID": "search-device-1"}

    # Ingest 3 thoughts
    await client.post(
        "/api/v1/thoughts",
        json={"id": str(uuid.uuid4()), "raw_text": "Building an autonomous AI coding agent with python", "send_to_ai": False},
        headers=headers
    )
    await client.post(
        "/api/v1/thoughts",
        json={"id": str(uuid.uuid4()), "raw_text": "Grocery shopping list: milk, eggs, bread", "send_to_ai": False},
        headers=headers
    )
    await client.post(
        "/api/v1/thoughts",
        json={"id": str(uuid.uuid4()), "raw_text": "AI architecture for edge machine learning models", "send_to_ai": False},
        headers=headers
    )

    # Search query "AI"
    res = await client.get("/api/v1/search?q=AI", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "AI"
    assert data["total_matches"] >= 2
    assert all("ai" in r["thought"]["raw_text"].lower() for r in data["results"])
