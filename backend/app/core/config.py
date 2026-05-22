from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EduFlow AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://eduflow-ai.vercel.app",
    ]

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "eduflow"

    # JWT
    SECRET_KEY: str = "change-this-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # WhatsApp Cloud API (Meta)
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "eduflow_verify_token"
    WHATSAPP_API_VERSION: str = "v21.0"

    # OpenAI / Gemini
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_PROVIDER: str = "openai"  # "openai" or "gemini"

    # Google Sheets
    GOOGLE_SHEETS_CREDENTIALS_FILE: str = "credentials.json"
    GOOGLE_SHEETS_TOKEN_FILE: str = "token.json"
    GOOGLE_SHEETS_SPREADSHEET_ID: str = ""

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
