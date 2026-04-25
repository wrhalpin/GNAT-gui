from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GNAT_GUI_", env_file=".env", extra="ignore")

    db_url: str = "postgresql+psycopg2://gnat_gui:gnat_gui@localhost/gnat_gui"
    secret_key: str = "change-me-in-production"
    session_expire_seconds: int = 86400
    login_rate_limit: str = "10/minute"

    gnat_config_path: str | None = None
    llm_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

    oidc_issuer: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None


settings = Settings()
