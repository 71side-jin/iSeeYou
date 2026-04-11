from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AI Detector API"
    DATABASE_URL: str
    SECRET_KEY: str = "change-this"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    STORAGE_ROOT: str = "storage"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()