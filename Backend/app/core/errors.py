import uuid
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    requestId: str
    retryable: bool = False
    details: Optional[Dict[str, Any]] = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        retryable: bool = False,
        details: Optional[Dict[str, Any]] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.retryable = retryable
        self.details = details or {}
        super().__init__(message)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    payload = {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "requestId": request_id,
            "retryable": exc.retryable,
            "details": exc.details
        }
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    code_map = {
        400: "BAD_REQUEST",
        401: "AUTH_REQUIRED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "VERSION_CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
        503: "AI_UNAVAILABLE"
    }
    code = code_map.get(exc.status_code, "ERROR")

    # If detail is already dict (e.g. from version conflict)
    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", "An error occurred")
        details = {k: v for k, v in exc.detail.items() if k != "message"}
        code = exc.detail.get("code", code)
    else:
        message = str(exc.detail)
        details = None

    payload = {
        "error": {
            "code": code,
            "message": message,
            "requestId": request_id,
            "retryable": exc.status_code in [429, 502, 503, 504],
            "details": details
        }
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    payload = {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid request payload schema",
            "requestId": request_id,
            "retryable": False,
            "details": {"errors": exc.errors()}
        }
    }
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)
