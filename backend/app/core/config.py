from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumio AI Platform API"
    DATABASE_URL: str
    GEMINI_API_KEY: str
    CLERK_SECRET_KEY: str = "sk_test_mock"
    CLERK_WEBHOOK_SECRET: str = "whsec_mock"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    R2_ACCOUNT_ID: str = "mock_account_id"
    R2_ACCESS_KEY_ID: str = "mock_access_key"
    R2_SECRET_ACCESS_KEY: str = "mock_secret_key"
    R2_BUCKET_NAME: str = "mock_bucket"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
