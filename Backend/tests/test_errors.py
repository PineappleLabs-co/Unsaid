import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_standard_error_envelope_format(client: AsyncClient):
    # 404 error
    res = await client.get("/api/v1/thoughts/non-existent-uuid", headers={"X-Device-ID": "test-dev"})
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "requestId" in data["error"]
    assert "retryable" in data["error"]
    assert "message" in data["error"]


@pytest.mark.asyncio
async def test_validation_error_envelope_format(client: AsyncClient):
    # Invalid POST payload
    res = await client.post("/api/v1/thoughts", json={"invalid_field": 123}, headers={"X-Device-ID": "test-dev"})
    assert res.status_code == 422
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "requestId" in data["error"]
