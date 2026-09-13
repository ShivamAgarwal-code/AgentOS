import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.database.schemas.health import HealthResponse
from backend.api.routes.metrics import router as metrics_router
from backend.api.routes.decision_replay import router as decision_replay_router

# Track uptime
start_time = time.time()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Your organization's reasoning engine. Chronicle watches Slack conversations and builds an organizational memory automatically."
)

# Include Routers
app.include_router(metrics_router)
app.include_router(decision_replay_router)

# Enable CORS for Next.js and React frontend environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
def root_health():
    """
    Root endpoint for uptime, version, and server health.
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected (SQLite)",
        "uptime": int(time.time() - start_time)
    }

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Dedicated health check endpoint for monitoring and infrastructure probes.
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected (SQLite)",
        "uptime": int(time.time() - start_time)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
