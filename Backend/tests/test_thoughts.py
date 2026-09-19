import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_and_get_thought(client: AsyncClient):
    thought_id = str(uuid.uuid4())
    headers = {"X-Device-ID": "test-device-123"}

    payload = {
        "id": thought_id,
        "raw_text": "Need to finish building the AI enrichment gateway today.",
        "capture_state": "committed",
        "send_to_ai": False
    }

    # Ingest thought
    response = await client.post("/api/v1/thoughts", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == thought_id
    assert data["raw_text"] == payload["raw_text"]
    assert data["version"] == 1
    assert data["capture_state"] == "committed"

    # Fetch thought
    get_res = await client.get(f"/api/v1/thoughts/{thought_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == thought_id


@pytest.mark.asyncio
async def test_optimistic_concurrency_update(client: AsyncClient):
    thought_id = str(uuid.uuid4())
    headers = {"X-Device-ID": "test-device-123"}

    # Create thought
    await client.post(
        "/api/v1/thoughts",
        json={"id": thought_id, "raw_text": "Initial text", "send_to_ai": False},
        headers=headers
    )

    # Valid update with base_version = 1
    update_res = await client.patch(
        f"/api/v1/thoughts/{thought_id}",
        json={"base_version": 1, "title": "Updated Title", "tags": ["tag1", "tag2"]},
        headers=headers
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["version"] == 2
    assert data["title"] == "Updated Title"
    assert data["title_edited_by_user"] is True
    assert data["tags"] == ["tag1", "tag2"]
    assert data["tags_edited_by_user"] is True

    # Stale update with old base_version = 1 (Should return 409 Conflict with PRD §25 envelope!)
    conflict_res = await client.patch(
        f"/api/v1/thoughts/{thought_id}",
        json={"base_version": 1, "title": "Stale Title"},
        headers=headers
    )
    assert conflict_res.status_code == 409
    error_data = conflict_res.json()["error"]
    assert error_data["code"] == "VERSION_CONFLICT"
    assert "details" in error_data
    assert error_data["details"]["client_base_version"] == 1
    assert error_data["details"]["server_version"] == 2
    assert error_data["details"]["server_thought"]["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_soft_delete_and_restore(client: AsyncClient):
    thought_id = str(uuid.uuid4())
    headers = {"X-Device-ID": "test-device-123"}

    # Create thought
    await client.post(
        "/api/v1/thoughts",
        json={"id": thought_id, "raw_text": "Delete me later", "send_to_ai": False},
        headers=headers
    )

    # Delete thought
    del_res = await client.delete(f"/api/v1/thoughts/{thought_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_deleted"] is True

    # List thoughts (default should exclude deleted)
    list_res = await client.get("/api/v1/thoughts", headers=headers)
    assert list_res.status_code == 200
    assert not any(t["id"] == thought_id for t in list_res.json()["items"])

    # Restore thought
    restore_res = await client.post(f"/api/v1/thoughts/{thought_id}/restore", headers=headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["is_deleted"] is False
