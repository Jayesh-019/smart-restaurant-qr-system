from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "Smart Restaurant QR System"
    app_version: str = "1.0.0"
    api_v1_prefix: str = "/api"
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 720
    database_url: str = Field(..., alias="DATABASE_URL")
    tax_rate: float = Field(0.08, alias="TAX_RATE")
    qr_base_url: str = Field("http://localhost:8000/customer", alias="QR_BASE_URL")

    default_admin_name: str = Field("System Admin", alias="DEFAULT_ADMIN_NAME")
    default_admin_email: str = Field("admin@restaurant.local", alias="DEFAULT_ADMIN_EMAIL")
    default_admin_password: str = Field("Admin@123", alias="DEFAULT_ADMIN_PASSWORD")

    default_cashier_name: str = Field("Default Cashier", alias="DEFAULT_CASHIER_NAME")
    default_cashier_email: str = Field("cashier@restaurant.local", alias="DEFAULT_CASHIER_EMAIL")
    default_cashier_password: str = Field("Cashier@123", alias="DEFAULT_CASHIER_PASSWORD")

    default_kitchen_name: str = Field("Kitchen Operator", alias="DEFAULT_KITCHEN_NAME")
    default_kitchen_email: str = Field("kitchen@restaurant.local", alias="DEFAULT_KITCHEN_EMAIL")
    default_kitchen_password: str = Field("Kitchen@123", alias="DEFAULT_KITCHEN_PASSWORD")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
