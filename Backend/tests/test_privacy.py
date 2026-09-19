import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_data_export(client: AsyncClient):
    user_id = "export-user-999"
    headers = {"Authorization": f"Bearer {user_id}"}

    # Ingest a thought
    tid = str(uuid.uuid4())
    await client.post(
        "/api/v1/thoughts",
        json={"id": tid, "raw_text": "Personal thought to be exported", "send_to_ai": False},
        headers=headers
    )

    # Export data
    export_res = await client.get("/api/v1/privacy/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["user_id"] == user_id
    assert export_data["thought_count"] >= 1
    assert any(t["id"] == tid for t in export_data["thoughts"])


@pytest.mark.asyncio
async def test_account_deletion_and_restoration(client: AsyncClient):
    user_id = "delete-user-555"
    headers = {"Authorization": f"Bearer {user_id}"}

    # Ingest a thought
    tid = str(uuid.uuid4())
    await client.post(
        "/api/v1/thoughts",
        json={"id": tid, "raw_text": "Thought before account deletion", "send_to_ai": False},
        headers=headers
    )

    # Request account deletion
    del_res = await client.post("/api/v1/privacy/delete-account", headers=headers)
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["is_deleted"] is True
    assert del_data["grace_period_days"] == 7

    # Active thought list should be empty
    list_res = await client.get("/api/v1/thoughts", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 0

    # Restore account within grace period
    restore_res = await client.post("/api/v1/privacy/restore-account", headers=headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["is_restored"] is True

    # Thought list should be accessible again
    restored_list = await client.get("/api/v1/thoughts", headers=headers)
    assert restored_list.status_code == 200
    assert len(restored_list.json()["items"]) >= 1
