from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class RevenueCatEvent(BaseModel):
    id: str = Field(..., description="RevenueCat Event UUID")
    type: str = Field(..., description="INITIAL_PURCHASE | RENEWAL | CANCELLATION | BILLING_ISSUE | EXPIRATION")
    app_user_id: str
    original_app_user_id: Optional[str] = None
    entitlement_id: Optional[str] = "pro"
    entitlement_ids: Optional[list] = None
    expiration_at_ms: Optional[int] = None
    purchased_at_ms: Optional[int] = None
    environment: Optional[str] = "PRODUCTION"


class RevenueCatWebhookPayload(BaseModel):
    api_version: Optional[str] = "1.0"
    event: RevenueCatEvent


class WebhookResponse(BaseModel):
    status: str
    event_id: str
    message: str
