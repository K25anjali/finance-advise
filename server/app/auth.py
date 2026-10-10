"""
Accounts: email + password, Google and GitHub sign-in, cookie sessions.

- Passwords: Argon2id (argon2-cffi).
- Sessions: a random token in an httpOnly cookie; the DB keeps only its SHA-256, so a DB leak
  doesn't hand out live sessions. Logging out deletes the row.
- OAuth: authorization-code flow. `state` is signed with SECRET_KEY and bound to a short-lived
  httpOnly nonce cookie (CSRF protection). Accounts are linked by *verified* email only.
"""

import hashlib
import logging
import re
import secrets
from datetime import timedelta
from typing import Literal, Optional
from urllib.parse import urlencode

import httpx
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from itsdangerous import BadSignature, URLSafeTimedSerializer
from pydantic import BaseModel, Field, field_validator
from app.config import get_settings
from app.db import Database, get_db, new_id, now_iso, parse_ts, utcnow
from app.http_utils import auth_rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

_hasher = PasswordHasher()
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_STATE_COOKIE = "ll_oauth_nonce"
_STATE_MAX_AGE = 600  # seconds

Provider = Literal["google", "github"]


# ─── Schemas ─────────────────────────────────────────────────────────────

class SignupBody(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=200)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Enter a valid email address")
        return v


class LoginBody(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(max_length=128)


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    has_password: bool
    providers: list[str]


def _providers_of(db: Database, user_id: str) -> list[str]:
    rows = db.all("SELECT DISTINCT provider FROM oauth_identities WHERE user_id = ?", user_id)
    return sorted(r["provider"] for r in rows)


def user_out(db: Database, user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user["name"] or user["email"].split("@")[0],
        avatar_url=user["avatar_url"],
        has_password=user["password_hash"] is not None,
        providers=_providers_of(db, user["id"]),
    )


def _user_by_email(db: Database, email: str) -> Optional[dict]:
    return db.one("SELECT * FROM users WHERE email = ?", email)


# ─── Sessions ────────────────────────────────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _start_session(db: Database, user_id: str, response: Response) -> None:
    settings = get_settings()
    token = secrets.token_urlsafe(32)
    db.run(
        "INSERT INTO login_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        _hash_token(token), user_id, now_iso(), (utcnow() + timedelta(days=settings.session_days)).isoformat(),
    )
    db.commit()
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def _session_user(request: Request, db: Database) -> Optional[dict]:
    token = request.cookies.get(get_settings().session_cookie_name)
    if not token:
        return None
    token_hash = _hash_token(token)
    row = db.one(
        """SELECT u.*, s.expires_at AS session_expires_at
           FROM login_sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token_hash = ?""",
        token_hash,
    )
    if row is None:
        return None
    if parse_ts(row.pop("session_expires_at")) < utcnow():
        db.run("DELETE FROM login_sessions WHERE token_hash = ?", token_hash)
        db.commit()
        return None
    return row


def current_user(request: Request, db: Database = Depends(get_db)) -> dict:
    """Dependency for routes that require a signed-in user. Returns the `users` row as a dict."""
    user = _session_user(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Not signed in")
    return user


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


# ─── Email + password ────────────────────────────────────────────────────

@router.post("/signup", response_model=UserOut, status_code=201)
def signup(body: SignupBody, request: Request, response: Response, db: Database = Depends(get_db)):
    if auth_rate_limiter.is_rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")

    existing = _user_by_email(db, body.email)
    if existing is not None:
        if existing["password_hash"] is None:
            providers = " or ".join(p.title() for p in _providers_of(db, existing["id"]))
            raise HTTPException(409, f"This email already has an account. Sign in with {providers or 'your provider'}.")
        raise HTTPException(409, "An account with this email already exists. Sign in instead.")

    user_id = new_id()
    db.run(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        user_id, body.email, body.name.strip(), _hasher.hash(body.password), now_iso(),
    )
    _start_session(db, user_id, response)  # commits
    logger.info(f"User signed up | user_id={user_id} | method=password")
    return user_out(db, _user_by_email(db, body.email))


@router.post("/login", response_model=UserOut)
def login(body: LoginBody, request: Request, response: Response, db: Database = Depends(get_db)):
    if auth_rate_limiter.is_rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")

    user = _user_by_email(db, body.email.strip().lower())
    if user is None or user["password_hash"] is None:
        if user is not None:  # OAuth-only account: say how to get in
            providers = " or ".join(p.title() for p in _providers_of(db, user["id"]))
            raise HTTPException(401, f"This account uses {providers} sign-in.")
        raise HTTPException(401, "Incorrect email or password.")
    try:
        _hasher.verify(user["password_hash"], body.password)
    except (VerifyMismatchError, InvalidHashError):
        raise HTTPException(401, "Incorrect email or password.")

    if _hasher.check_needs_rehash(user["password_hash"]):
        db.run("UPDATE users SET password_hash = ? WHERE id = ?", _hasher.hash(body.password), user["id"])
    _start_session(db, user["id"], response)
    return user_out(db, user)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Database = Depends(get_db)):
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        db.run("DELETE FROM login_sessions WHERE token_hash = ?", _hash_token(token))
        db.commit()
    response.delete_cookie(settings.session_cookie_name, path="/", samesite=settings.cookie_samesite,
                           secure=settings.cookie_secure)


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(current_user), db: Database = Depends(get_db)):
    return user_out(db, user)


# ─── OAuth (Google, GitHub) ──────────────────────────────────────────────

_PROVIDERS = {
    "google": {
        "authorize": "https://accounts.google.com/o/oauth2/v2/auth",
        "token": "https://oauth2.googleapis.com/token",
        "scope": "openid email profile",
    },
    "github": {
        "authorize": "https://github.com/login/oauth/authorize",
        "token": "https://github.com/login/oauth/access_token",
        "scope": "read:user user:email",
    },
}


def _credentials(provider: str) -> tuple[str, str]:
    s = get_settings()
    return {
        "google": (s.google_client_id, s.google_client_secret),
        "github": (s.github_client_id, s.github_client_secret),
    }.get(provider, ("", ""))


def _redirect_uri(provider: str) -> str:
    return f"{get_settings().public_api_url.rstrip('/')}/auth/oauth/{provider}/callback"


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().secret_key, salt="oauth-state")


def _safe_next(next_path: Optional[str]) -> str:
    # Only same-site relative paths — never let `next` bounce users to another origin.
    if next_path and next_path.startswith("/") and not next_path.startswith("//"):
        return next_path
    return "/app"


def _to_frontend(path: str) -> RedirectResponse:
    return RedirectResponse(f"{get_settings().frontend_url.rstrip('/')}{path}", status_code=302)


@router.get("/providers")
def providers():
    """Which social sign-in buttons the UI should enable."""
    return {p: all(_credentials(p)) for p in _PROVIDERS}


@router.get("/oauth/{provider}/start")
def oauth_start(provider: Provider, next: Optional[str] = None):
    client_id, client_secret = _credentials(provider)
    if not (client_id and client_secret):
        return _to_frontend(f"/login?error={provider}_not_configured")

    nonce = secrets.token_urlsafe(16)
    state = _serializer().dumps({"n": nonce, "next": _safe_next(next)})
    cfg = _PROVIDERS[provider]
    params = {
        "client_id": client_id,
        "redirect_uri": _redirect_uri(provider),
        "scope": cfg["scope"],
        "state": state,
        "response_type": "code",
    }
    if provider == "google":
        params["prompt"] = "select_account"

    resp = RedirectResponse(f"{cfg['authorize']}?{urlencode(params)}", status_code=302)
    s = get_settings()
    resp.set_cookie(_STATE_COOKIE, nonce, max_age=_STATE_MAX_AGE, httponly=True,
                    secure=s.cookie_secure, samesite="lax", path="/")
    return resp


async def _fetch_profile(provider: str, code: str) -> dict:
    """Exchange the code and return {id, email, email_verified, name, avatar_url}."""
    client_id, client_secret = _credentials(provider)
    cfg = _PROVIDERS[provider]
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post(
            cfg["token"],
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        token_res.raise_for_status()
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise ValueError("No access token in provider response")
        auth = {"Authorization": f"Bearer {access_token}"}

        if provider == "google":
            info = (await client.get("https://openidconnect.googleapis.com/v1/userinfo", headers=auth)).json()
            return {
                "id": str(info["sub"]),
                "email": (info.get("email") or "").lower(),
                "email_verified": bool(info.get("email_verified")),
                "name": info.get("name") or "",
                "avatar_url": info.get("picture"),
            }

        gh_headers = {**auth, "Accept": "application/vnd.github+json"}
        info = (await client.get("https://api.github.com/user", headers=gh_headers)).json()
        emails = (await client.get("https://api.github.com/user/emails", headers=gh_headers)).json()
        primary = next((e for e in emails if e.get("primary") and e.get("verified")), None) if isinstance(emails, list) else None
        return {
            "id": str(info["id"]),
            "email": (primary["email"] if primary else "").lower(),
            "email_verified": primary is not None,
            "name": info.get("name") or info.get("login") or "",
            "avatar_url": info.get("avatar_url"),
        }


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: Provider,
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Database = Depends(get_db),
):
    if error or not code or not state:
        return _to_frontend("/login?error=oauth_cancelled")

    try:
        data = _serializer().loads(state, max_age=_STATE_MAX_AGE)
    except BadSignature:
        return _to_frontend("/login?error=oauth_state")
    if not secrets.compare_digest(str(data.get("n", "")), request.cookies.get(_STATE_COOKIE, "")):
        return _to_frontend("/login?error=oauth_state")

    try:
        profile = await _fetch_profile(provider, code)
    except Exception as e:
        logger.warning(f"OAuth exchange failed | provider={provider} | error={e}")
        return _to_frontend("/login?error=oauth_failed")

    identity = db.one(
        "SELECT user_id FROM oauth_identities WHERE provider = ? AND provider_user_id = ?",
        provider, profile["id"],
    )
    if identity is not None:
        user_id = identity["user_id"]
    else:
        if not (profile["email"] and profile["email_verified"]):
            return _to_frontend("/login?error=oauth_no_email")
        # Link to an existing account only through a verified email.
        user = _user_by_email(db, profile["email"])
        if user is None:
            user_id = new_id()
            db.run(
                "INSERT INTO users (id, email, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)",
                user_id, profile["email"], profile["name"], profile["avatar_url"], now_iso(),
            )
        else:
            user_id = user["id"]
            # Fill in profile gaps without overwriting what the user already has.
            db.run(
                """UPDATE users SET avatar_url = COALESCE(avatar_url, ?),
                                    name = CASE WHEN name = '' THEN ? ELSE name END
                   WHERE id = ?""",
                profile["avatar_url"], profile["name"], user_id,
            )
        db.run(
            "INSERT INTO oauth_identities (id, user_id, provider, provider_user_id, created_at) VALUES (?, ?, ?, ?, ?)",
            new_id(), user_id, provider, profile["id"], now_iso(),
        )
        db.commit()
        logger.info(f"OAuth sign-in linked | user_id={user_id} | provider={provider}")

    resp = _to_frontend(_safe_next(data.get("next")))
    resp.delete_cookie(_STATE_COOKIE, path="/")
    _start_session(db, user_id, resp)
    return resp
