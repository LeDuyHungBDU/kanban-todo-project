from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, boards, tasks  # Thêm auth router
from app.database import create_tables
from app.core.config import settings

# Tạo tables khi khởi động (development only)
create_tables()

# Tạo FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Kanban TODO API với JWT Authentication",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(auth.router)  # Authentication routes
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {
        "message": f"Chào mừng đến với {settings.app_name}!",
        "version": "1.0.0",
        "features": [
            "JWT Authentication",
            "Role-based Authorization", 
            "Secure Password Hashing",
            "Protected API Endpoints"
        ],
        "docs_url": "/docs",
        "auth_endpoints": {
            "register": "/auth/register",
            "login": "/auth/login",
            "refresh": "/auth/refresh"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "authentication": "enabled",
        "database": "connected"
    }
