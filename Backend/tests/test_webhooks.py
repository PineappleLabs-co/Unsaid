import pytest
import uuid
from httpx import AsyncClient
from app.config import settings


@pytest.mark.asyncio
async def test_revenuecat_webhook_flow(client: AsyncClient):
    event_id = str(uuid.uuid4())
    user_id = "paying-user-777"
    headers = {"Authorization": f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"}

    webhook_payload = {
        "api_version": "1.0",
        "event": {
            "id": event_id,
            "type": "INITIAL_PURCHASE",
            "app_user_id": user_id,
            "entitlement_id": "pro",
            "environment": "PRODUCTION"
        }
    }

    # First webhook submission
    response = await client.post("/api/v1/webhooks/revenuecat", json=webhook_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # User should now be recognized as Pro in session
    user_headers = {"Authorization": f"Bearer {user_id}"}
    session_res = await client.get("/api/v1/auth/session", headers=user_headers)
    assert session_res.status_code == 200
    assert session_res.json()["plan"] == "pro"

    # Deduplication test: Send identical webhook event again
    dup_response = await client.post("/api/v1/webhooks/revenuecat", json=webhook_payload, headers=headers)
    assert dup_response.status_code == 200
    assert dup_response.json()["status"] == "ignored_duplicate"
