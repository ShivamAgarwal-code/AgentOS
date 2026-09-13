from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Chronicle AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Configuration
    SQLITE_DB_FILE: str = "chronicle_memory.db"
    
    # Slack Configuration
    SLACK_BOT_TOKEN: Optional[str] = None
    SLACK_SIGNING_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
