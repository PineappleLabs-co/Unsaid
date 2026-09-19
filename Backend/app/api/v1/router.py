from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.thoughts import router as thoughts_router
from app.api.v1.enrichment import router as enrichment_router
from app.api.v1.sync import router as sync_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.privacy import router as privacy_router
from app.api.v1.search import router as search_router
from app.api.v1.audio import router as audio_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(thoughts_router)
api_v1_router.include_router(enrichment_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(audio_router)
api_v1_router.include_router(sync_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(privacy_router)
