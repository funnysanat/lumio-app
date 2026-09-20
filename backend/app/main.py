from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users, onboarding, session, dashboard, therapist, marketplace, videos, webhooks, consultations, ai

app = FastAPI(title="Lumio API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(onboarding.router, prefix="/api/v1/onboarding", tags=["onboarding"])
app.include_router(session.router, prefix="/api/v1/session", tags=["session"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(therapist.router, prefix="/api/v1/therapist", tags=["therapist"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(videos.router, prefix="/api/v1/video", tags=["video"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])
app.include_router(consultations.router, prefix="/api/v1/consultations", tags=["consultations"])
