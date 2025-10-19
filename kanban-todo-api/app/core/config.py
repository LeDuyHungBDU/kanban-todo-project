from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    database_url: str
    database_echo: bool = False

    # Application
    app_name: str = "Kanban TODO API"
    debug: bool = True

    # CORS Settings
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # JWT Settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int


    class Config:
        env_file = ".env"

settings = Settings()
