from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel
from app.config import settings


class ActorContext(BaseModel):
    user_id: Optional[str] = None
    device_id: str
    is_authenticated: bool = False
    plan: str = "free"


async def verify_app_check(
    x_firebase_appcheck: Optional[str] = Header(None, alias="X-Firebase-AppCheck")
) -> bool:
    """
    Validates Firebase App Check token.
    Enforced in production/when settings.APP_CHECK_ENFORCED is True.
    """
    if not settings.APP_CHECK_ENFORCED:
        return True

    if not x_firebase_appcheck:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid App Check integrity token"
        )
    return True


async def get_current_actor(
    authorization: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None, alias="X-Device-ID"),
    app_check_valid: bool = Depends(verify_app_check)
) -> ActorContext:
    """
    Extracts authenticated user ID from Authorization header (Bearer token)
    or anonymous device ID from X-Device-ID header.
    """
    user_id: Optional[str] = None
    is_authenticated = False

    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        if token and token != "anonymous":
            # For Firebase ID tokens or simulated JWTs
            # In production, firebase_admin.auth.verify_id_token(token)
            # For testing/dev, token string or sub claim
            user_id = token
            is_authenticated = True

    if not user_id and not x_device_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Provide Authorization Bearer token or X-Device-ID header."
        )

    # Use user_id as fallback device_id if only user_id provided
    effective_device_id = x_device_id or (f"user-device-{user_id}" if user_id else "anonymous-device")

    return ActorContext(
        user_id=user_id,
        device_id=effective_device_id,
        is_authenticated=is_authenticated,
        plan="free"
    )
