from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, boards, tasks
from app.database import create_tables
from app.core.config import settings

# Tạo tables khi khởi động (development only)
create_tables()

# Tạo FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Kanban TODO API với SQLAlchemy database integration",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {
        "message": f"Chào mừng đến với {settings.app_name}!",
        "version": "1.0.0",
        "database": "SQLAlchemy integrated",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

