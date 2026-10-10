"""
Shared pytest configuration.

- Registers the `integration` marker and skips those tests when the configured provider has no API key,
  so `pytest` passes cleanly on a fresh clone.
- Resets the in-memory rate limiter and circuit breaker between tests, since both are
  module-level singletons and every TestClient request shares the same "IP".
- Points the app at a throwaway SQLite database so tests never touch real user data.
"""

import os
import tempfile

# Must run before the app (and its cached settings) is imported.
# Set TEST_DATABASE_URL to run the suite against Postgres; it should point at a throwaway database.
os.environ["DATABASE_URL"] = (
    os.environ.get("TEST_DATABASE_URL")
    or f"sqlite:///{tempfile.mkdtemp(prefix='ledgerline-test-')}/test.db"
)

import pytest

from app.config import get_settings
from app.db import init_db
from app.fallbacks import circuit_breaker
from app.http_utils import auth_rate_limiter
from app.main import rate_limiter

init_db()


def pytest_configure(config):
    config.addinivalue_line("markers", "integration: makes real LLM API calls (needs the key for LLM_PROVIDER)")


def pytest_collection_modifyitems(config, items):
    key = get_settings().active_api_key
    if key and "your-key" not in key:  # ignore the .env.example placeholder
        return
    skip = pytest.mark.skip(reason="No API key for the configured LLM_PROVIDER — skipping real LLM calls")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)


@pytest.fixture(autouse=True)
def reset_singletons():
    rate_limiter.requests.clear()
    auth_rate_limiter.requests.clear()
    circuit_breaker.record_success()
    yield
