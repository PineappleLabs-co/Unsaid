import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.core.errors import AppError


class SlidingWindowRateLimiter:
    def __init__(self):
        # Key -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        # Clean older entries
        self.requests[key] = [t for t in self.requests[key] if t > cutoff]

        if len(self.requests[key]) >= max_requests:
            return True

        self.requests[key].append(now)
        return False


limiter = SlidingWindowRateLimiter()


async def check_rate_limit(request: Request, max_requests: int = 60, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "127.0.0.1"
    auth_header = request.headers.get("Authorization", "")
    device_id = request.headers.get("X-Device-ID", "")

    identifier = auth_header or device_id or client_ip
    path = request.url.path

    rate_key = f"{identifier}:{path}"

    if limiter.is_rate_limited(rate_key, max_requests=max_requests, window_seconds=window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": f"Rate limit exceeded ({max_requests} requests per {window_seconds}s). Please slow down.",
                "retryable": True
            }
        )
