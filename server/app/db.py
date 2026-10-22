"""
Persistence with raw SQL — no ORM.

Runs on SQLite (default, zero setup) and Postgres (set DATABASE_URL). To keep one set of queries
working on both, the SQL sticks to the common subset:
- placeholders are written as `?` and translated to `%s` for Postgres
- ids are TEXT (uuid4 hex), timestamps are ISO-8601 UTC TEXT, JSON is TEXT

Rows come back as plain dicts. Schema changes beyond CREATE TABLE IF NOT EXISTS need a migration.
"""

import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, Optional

from app.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL DEFAULT '',
    avatar_url    TEXT,
    password_hash TEXT,                          -- NULL → OAuth-only account
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_identities (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         TEXT NOT NULL,              -- 'google' | 'github'
    provider_user_id TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS ix_oauth_identities_user ON oauth_identities (user_id);

-- The cookie holds a random token. Only its SHA-256 is stored here.
CREATE TABLE IF NOT EXISTS login_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_login_sessions_user ON login_sessions (user_id);

CREATE TABLE IF NOT EXISTS cases (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL DEFAULT 'New case',
    category   TEXT,
    urgency    TEXT,
    context    TEXT NOT NULL DEFAULT '{}',       -- JSON: business_type, annual_revenue, state, urgency_hint
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cases_user_updated ON cases (user_id, updated_at);

CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    case_id         TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,               -- 'user' | 'assistant'
    content         TEXT NOT NULL DEFAULT '',
    attachment_name TEXT,
    advisory        TEXT,                        -- JSON AdvisoryResponse for assistant turns
    created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_messages_case_created ON messages (case_id, created_at);
"""


def new_id() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return utcnow().isoformat()


def parse_ts(value: str) -> datetime:
    """ISO text → aware UTC datetime (tolerates naive values written by older code)."""
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ─── Connection wrapper ───────────────────────────────────────────────────

def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


class Database:
    """A thin wrapper over one DB-API connection: `one`, `all`, `run`, `commit`, `rollback`."""

    def __init__(self, conn, sqlite: bool):
        self._conn = conn
        self._sqlite = sqlite

    def _sql(self, sql: str) -> str:
        return sql if self._sqlite else sql.replace("?", "%s")

    def _execute(self, sql: str, params: tuple):
        cur = self._conn.cursor()
        cur.execute(self._sql(sql), params)
        return cur

    def one(self, sql: str, *params: Any) -> Optional[dict]:
        row = self._execute(sql, params).fetchone()
        return dict(row) if row is not None else None

    def all(self, sql: str, *params: Any) -> list[dict]:
        return [dict(r) for r in self._execute(sql, params).fetchall()]

    def run(self, sql: str, *params: Any) -> int:
        """INSERT / UPDATE / DELETE. Returns the affected row count."""
        return self._execute(sql, params).rowcount

    def commit(self) -> None:
        self._conn.commit()

    def rollback(self) -> None:
        self._conn.rollback()

    def close(self) -> None:
        self._conn.close()


def connect() -> Database:
    url = get_settings().database_url
    if _is_sqlite(url):
        path = url.removeprefix("sqlite:///")
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        # check_same_thread=False: FastAPI may open the connection in a worker thread and use it
        # in the event loop. Each request still gets its own connection, so there's no sharing.
        conn = sqlite3.connect(path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")  # SQLite ignores ON DELETE CASCADE without this
        return Database(conn, sqlite=True)

    import psycopg
    from psycopg.rows import dict_row

    # libpq accepts both postgresql:// and the postgres:// form Render hands out.
    return Database(psycopg.connect(url, row_factory=dict_row), sqlite=False)


def _migrate(db: Database) -> None:
    """Idempotent data migrations, run on every startup (no-ops once applied)."""
    # 2026-10: the "unclear" category was renamed to "other".
    db.run("UPDATE cases SET category = 'other' WHERE category = 'unclear'")
    # Patterns go in as parameters: a literal % in the SQL would be read as a placeholder by psycopg.
    old, new = '"category":"unclear"', '"category":"other"'
    db.run("UPDATE messages SET advisory = REPLACE(advisory, ?, ?) WHERE advisory LIKE ?", old, new, f"%{old}%")


def init_db() -> None:
    # Strip `--` comments first so a stray ';' in a comment can't split a statement.
    sql = re.sub(r"--[^\n]*", "", SCHEMA)
    db = connect()
    try:
        for statement in filter(None, (s.strip() for s in sql.split(";"))):
            db.run(statement)
        _migrate(db)
        db.commit()
    finally:
        db.close()


def get_db() -> Iterator[Database]:
    """FastAPI dependency: one connection per request, closed afterwards.
    (Fine at this scale; add a pool such as psycopg_pool before real traffic.)"""
    db = connect()
    try:
        yield db
    finally:
        db.close()
