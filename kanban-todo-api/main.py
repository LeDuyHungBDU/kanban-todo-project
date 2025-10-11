from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, boards, tasks

# Tạo FastAPI app instance
app = FastAPI(
    title="Kanban TODO API",
    version="1.0.0",
    description="API để quản lý công việc theo mô hình Kanban board",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Thêm CORS middleware để frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên chỉ định cụ thể domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include các routers
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(tasks.router)

# Root endpoint
@app.get("/")
def read_root():
    """Welcome endpoint"""
    return {
        "message": "Chào mừng đến với Kanban TODO API!",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "endpoints": {
            "users": "/users",
            "boards": "/boards", 
            "tasks": "/tasks"
        }
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Kiểm tra API có hoạt động không"""
    return {
        "status": "healthy",
        "service": "Kanban TODO API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # The FastAPI application object is defined in this module (main.py),
    # so point uvicorn to "main:app" when running from the package root.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

