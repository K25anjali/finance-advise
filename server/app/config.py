"""
Application configuration loaded from environment variables.
Uses pydantic-settings for validation and type safety.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
from typing import Literal

_SERVER_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = _SERVER_ROOT.parent


class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    # Which LLM provider handles requests: "anthropic" or "openai"
    llm_provider: Literal["anthropic", "openai"] = "anthropic"

    # Anthropic Configuration — cheap, fast primary; stronger model as fallback
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-5-5"
    anthropic_fallback_model: str = "claude-sonnet-5-5"
    anthropic_effort: Literal["low", "medium", "high", "xhigh", "max"] = "low"  # classification doesn't need deep thinking
    anthropic_max_tokens: int = 16000  # headroom for adaptive thinking + the JSON answer

    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_fallback_model: str = "gpt-4o"

    # LLM Behavior
    llm_temperature: float = 0.2  # OpenAI only — current Claude models reject non-default temperature
    llm_max_tokens: int = 2000  # OpenAI only
    llm_timeout_seconds: int = 30

    # Confidence Thresholds
    confidence_low_threshold: float = 0.4   # Below this → "unclear" category
    confidence_medium_threshold: float = 0.7  # Below this → low confidence warning

    # Rate Limiting (in-memory, per instance)
    rate_limit_requests: int = 10
    rate_limit_window_seconds: int = 60

    # Input Constraints
    max_input_length: int = 5000
    min_input_length: int = 10
    max_file_size_bytes: int = 5 * 1024 * 1024  # 5MB

    # Circuit Breaker
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_window_seconds: int = 60
    circuit_breaker_cooldown_seconds: int = 30

    # Logging
    log_level: str = "INFO"

    # ── Accounts & persistence ──
    database_url: str = f"sqlite:///{_SERVER_ROOT / 'data' / 'ledgerline.db'}"
    secret_key: str = "dev-insecure-secret-change-me"  # signs OAuth state; MUST be set in production
    session_days: int = 30
    session_cookie_name: str = "ll_session"
    cookie_secure: bool = False  # True in production (HTTPS)
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"  # "none" if web and API are on different sites

    # Where the browser reaches the UI and the API. In dev the API sits behind Vite's /api proxy,
    # so both share the web origin and cookies are first-party.
    frontend_url: str = "http://localhost:5173"
    public_api_url: str = "http://localhost:5173/api"

    # OAuth apps (leave blank to disable that provider)
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""

    # ── Provider-resolved values ──
    @property
    def primary_model(self) -> str:
        return self.anthropic_model if self.llm_provider == "anthropic" else self.openai_model

    @property
    def fallback_model(self) -> str:
        return self.anthropic_fallback_model if self.llm_provider == "anthropic" else self.openai_fallback_model

    @property
    def active_api_key(self) -> str:
        return self.anthropic_api_key if self.llm_provider == "anthropic" else self.openai_api_key

    model_config = {
        # Repo-root env file first, then server/ — later entries win; missing files are skipped.
        "env_file": (str(_REPO_ROOT / ".env"), str(_SERVER_ROOT / ".env")),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — created once, reused across requests."""
    return Settings()
