from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AI Detector API"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    STORAGE_ROOT: str = "storage"

    NCLOUD_ACCESS_KEY: str
    NCLOUD_SECRET_KEY: str
    NCLOUD_ENDPOINT: str
    NCLOUD_BUCKET: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()