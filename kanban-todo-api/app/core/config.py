from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    database_echo: bool = False

    # Application
    app_name: str = "Kanban TODO API"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
