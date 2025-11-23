from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    database_url: str
    database_echo: bool = False

    # Application
    app_name: str = "Kanban TODO API"
    debug: bool = True

    # CORS Settings
    cors_origins: List[str] = [
        # Local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        # Production - Vercel
        "https://*.vercel.app",
        # Note: All Vercel preview deployments (*.vercel.app) 
        # are handled by allow_origin_regex in main.py
    ]

    # JWT Settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int


    class Config:
        env_file = "kanban-todo-api/.env"

settings = Settings()
