import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_enrichment_and_user_edit_preservation(client: AsyncClient):
    thought_id = str(uuid.uuid4())
    headers = {"X-Device-ID": "test-device-enrich"}

    # Create thought with user edited title
    await client.post(
        "/api/v1/thoughts",
        json={"id": thought_id, "raw_text": "Building a voice agent to automate capturing product ideas", "send_to_ai": False},
        headers=headers
    )

    # User explicitly sets their custom title
    await client.patch(
        f"/api/v1/thoughts/{thought_id}",
        json={"base_version": 1, "title": "My Custom Title"},
        headers=headers
    )

    # Trigger manual enrichment
    enrich_res = await client.post(f"/api/v1/enrichment/{thought_id}/retry", headers=headers)
    assert enrich_res.status_code == 200
    enriched = enrich_res.json()

    # User's title MUST be preserved!
    assert enriched["title"] == "My Custom Title"
    assert enriched["title_edited_by_user"] is True
    assert enriched["enrichment_status"] == "complete"
    assert enriched["summary"] is not None
    assert len(enriched["tags"]) > 0


@pytest.mark.asyncio
async def test_quota_limits(client: AsyncClient):
    headers = {"X-Device-ID": "quota-test-device"}

    # Check session remaining quota
    session_res = await client.get("/api/v1/auth/session", headers=headers)
    assert session_res.status_code == 200
    session_data = session_res.json()
    assert session_data["daily_enrichments_remaining"] == 2
    assert session_data["weekly_enrichments_remaining"] == 10

    # Consume 2 enrichments
    for i in range(2):
        tid = str(uuid.uuid4())
        await client.post(
            "/api/v1/thoughts",
            json={"id": tid, "raw_text": f"Thought number {i}", "send_to_ai": False},
            headers=headers
        )
        res = await client.post(f"/api/v1/enrichment/{tid}/retry", headers=headers)
        assert res.status_code == 200
        assert res.json()["enrichment_status"] == "complete"

    # 3rd enrichment should fail with QUOTA_EXCEEDED
    tid3 = str(uuid.uuid4())
    await client.post(
        "/api/v1/thoughts",
        json={"id": tid3, "raw_text": "Thought exceeding quota", "send_to_ai": False},
        headers=headers
    )
    res3 = await client.post(f"/api/v1/enrichment/{tid3}/retry", headers=headers)
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["enrichment_status"] == "failed"
    assert data3["enrichment_error"]["code"] == "QUOTA_EXCEEDED"
