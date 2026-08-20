from fastapi import APIRouter
from app.api.routes import ai, webhooks, onboarding, dashboard, session, websockets

api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(session.router, prefix="/session", tags=["session"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
