"""EduFlow AI — FastAPI Application Entry Point"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1 import auth, leads, whatsapp, ai, tasks, analytics, sheets, settings as settings_router

# ─── Rate Limiter ────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App ─────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered WhatsApp CRM & Admission Automation Platform for Education Consultancies",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Logging Middleware ───────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    logger.debug(f"← {response.status_code} {request.url.path}")
    return response

# ─── Global Error Handler ─────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again."},
    )

# ─── Lifecycle Events ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()
    logger.info("Application shutdown complete")

# ─── Routers ─────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(leads.router, prefix=API_PREFIX)
app.include_router(whatsapp.router, prefix=API_PREFIX)
app.include_router(ai.router, prefix=API_PREFIX)
app.include_router(tasks.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(sheets.router, prefix=API_PREFIX)
app.include_router(settings_router.router, prefix=API_PREFIX)

# ─── Health Check ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
