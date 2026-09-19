import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_delta_sync(client: AsyncClient):
    headers = {"X-Device-ID": "sync-device-a"}
    tid1 = str(uuid.uuid4())
    tid2 = str(uuid.uuid4())

    # Create thought 1
    await client.post(
        "/api/v1/thoughts",
        json={"id": tid1, "raw_text": "Sync thought 1", "send_to_ai": False},
        headers=headers
    )

    # Sync request with batch item for thought 2
    sync_payload = {
        "last_sync_timestamp": None,
        "client_changes": [
            {
                "id": tid2,
                "create_data": {
                    "id": tid2,
                    "raw_text": "Sync thought 2",
                    "send_to_ai": False
                }
            }
        ]
    }

    res = await client.post("/api/v1/sync", json=sync_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["updated_thoughts"]) >= 2
    assert any(t["id"] == tid1 for t in data["updated_thoughts"])
    assert any(t["id"] == tid2 for t in data["updated_thoughts"])


@pytest.mark.asyncio
async def test_anonymous_to_user_migration(client: AsyncClient):
    device_id = "device-migrating-123"
    anon_headers = {"X-Device-ID": device_id}
    tid = str(uuid.uuid4())

    # Create thought under anonymous device ID
    await client.post(
        "/api/v1/thoughts",
        json={"id": tid, "raw_text": "Captured before sign-in", "send_to_ai": False},
        headers=anon_headers
    )

    # User signs in (Authorization header with user ID)
    user_headers = {
        "Authorization": "Bearer user-account-abc",
        "X-Device-ID": device_id
    }

    # Migrate session
    migrate_res = await client.post(
        "/api/v1/auth/migrate",
        json={"device_id": device_id},
        headers=user_headers
    )
    assert migrate_res.status_code == 200
    assert migrate_res.json()["migrated_thought_count"] >= 1

    # Fetch thought with user auth (no device ID header)
    auth_only_headers = {"Authorization": "Bearer user-account-abc"}
    get_res = await client.get(f"/api/v1/thoughts/{tid}", headers=auth_only_headers)
    assert get_res.status_code == 200
    assert get_res.json()["user_id"] == "user-account-abc"
