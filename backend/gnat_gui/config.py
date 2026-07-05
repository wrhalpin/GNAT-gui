from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GNAT_GUI_", env_file=".env", extra="ignore")

    db_url: str = "sqlite:///./dev.db"
    secret_key: str = "change-me-in-production"  # noqa: S105  placeholder; override in prod
    session_expire_seconds: int = 86400
    login_rate_limit: str = "10/minute"
    # Session and CSRF cookies are marked Secure only when enabled. Keep this False for
    # local HTTP dev (browsers drop Secure cookies over plain http on non-localhost hosts);
    # set GNAT_GUI_COOKIE_SECURE=true behind TLS in production.
    cookie_secure: bool = False

    gnat_config_path: str | None = None
    llm_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

    oidc_issuer: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None


settings = Settings()
