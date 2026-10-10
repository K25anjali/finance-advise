"""
Accounts and saved case threads: signup/login/logout, session cookies, OAuth guards,
per-user isolation of history, and thread context. The LLM is mocked.
"""

import uuid
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from app.cases import compose_description
from app.config import get_settings
from app.main import app
from app.models import LLMRawOutput


def new_client() -> TestClient:
    return TestClient(app)  # each client has its own cookie jar = its own browser


def signup(client: TestClient, email: str | None = None, password: str = "correct-horse-1"):
    email = email or f"user-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/signup", json={"email": email, "password": password, "name": "Test User"})
    return email, res


def llm_output(**overrides) -> LLMRawOutput:
    data = dict(
        thinking="t", category="cash_flow_management", confidence=0.9,
        primary_issue="Cannot make payroll this Friday", financial_amount="$40k", deadline="Friday",
        entities_involved=["clients"], prior_actions=None, urgency="critical", has_sufficient_info=False,
        missing_information=["Payroll total"], recommended_action="Call your bank today.",
        rationale="Payroll at risk.", follow_up_questions=["How much is payroll?"],
    )
    data.update(overrides)
    return LLMRawOutput(**data)


@pytest.fixture
def mock_llm():
    with patch("app.advisor._call_llm", new_callable=AsyncMock) as m:
        m.return_value = (llm_output(), 120)
        yield m


# ─── Email + password ────────────────────────────────────────────────────

class TestPasswordAuth:
    def test_signup_sets_session_and_me_works(self):
        c = new_client()
        email, res = signup(c)
        assert res.status_code == 201
        assert res.json()["email"] == email
        assert get_settings().session_cookie_name in res.cookies
        me = c.get("/auth/me")
        assert me.status_code == 200 and me.json()["email"] == email

    def test_session_cookie_is_httponly(self):
        _, res = signup(new_client())
        header = res.headers["set-cookie"].lower()
        assert "httponly" in header and "samesite=lax" in header

    def test_email_is_normalised(self):
        c = new_client()
        tag = uuid.uuid4().hex[:6]
        _, res = signup(c, email=f"  Mixed.Case-{tag}@Example.COM ")
        assert res.json()["email"] == f"mixed.case-{tag}@example.com"

    def test_duplicate_email_rejected(self):
        email, _ = signup(new_client())
        _, res = signup(new_client(), email=email)
        assert res.status_code == 409

    @pytest.mark.parametrize("password", ["short", "1234567"])
    def test_weak_password_rejected(self, password):
        _, res = signup(new_client(), password=password)
        assert res.status_code == 422

    def test_invalid_email_rejected(self):
        _, res = signup(new_client(), email="not-an-email")
        assert res.status_code == 422

    def test_login_and_wrong_password(self):
        email, _ = signup(new_client())
        c = new_client()
        bad = c.post("/auth/login", json={"email": email, "password": "wrong-password"})
        assert bad.status_code == 401
        assert c.get("/auth/me").status_code == 401
        ok = c.post("/auth/login", json={"email": email.upper(), "password": "correct-horse-1"})
        assert ok.status_code == 200
        assert c.get("/auth/me").status_code == 200

    def test_unknown_email_gives_same_error_as_wrong_password(self):
        res = new_client().post("/auth/login", json={"email": "nobody@example.com", "password": "whatever-123"})
        assert res.status_code == 401
        assert res.json()["detail"] == "Incorrect email or password."

    def test_logout_revokes_session_server_side(self):
        c = new_client()
        signup(c)
        token = c.cookies.get(get_settings().session_cookie_name)
        assert c.post("/auth/logout").status_code == 204
        # Replaying the old cookie must not work — the session row is gone.
        replay = new_client()
        replay.cookies.set(get_settings().session_cookie_name, token)
        assert replay.get("/auth/me").status_code == 401

    def test_forged_cookie_rejected(self):
        c = new_client()
        c.cookies.set(get_settings().session_cookie_name, "forged-token")
        assert c.get("/auth/me").status_code == 401

    def test_login_is_rate_limited(self):
        c = new_client()
        codes = [c.post("/auth/login", json={"email": "x@example.com", "password": "nope-nope"}).status_code
                 for _ in range(11)]
        assert codes[-1] == 429


# ─── OAuth guards ────────────────────────────────────────────────────────

class TestOAuth:
    def test_providers_reports_unconfigured(self):
        res = new_client().get("/auth/providers").json()
        assert set(res) == {"google", "github"}

    def test_start_without_credentials_redirects_to_login_error(self):
        settings = get_settings()
        with patch.object(settings, "google_client_id", ""), patch.object(settings, "google_client_secret", ""):
            res = new_client().get("/auth/oauth/google/start", follow_redirects=False)
        assert res.status_code == 302
        assert "/login?error=google_not_configured" in res.headers["location"]

    def test_start_redirects_with_signed_state_and_nonce_cookie(self):
        settings = get_settings()
        with patch.object(settings, "github_client_id", "cid"), patch.object(settings, "github_client_secret", "sec"):
            res = new_client().get("/auth/oauth/github/start?next=/app/c/123", follow_redirects=False)
        loc = urlparse(res.headers["location"])
        assert loc.netloc == "github.com"
        q = parse_qs(loc.query)
        assert q["client_id"] == ["cid"]
        assert q["redirect_uri"][0].endswith("/auth/oauth/github/callback")
        assert "ll_oauth_nonce" in res.cookies

    def test_callback_rejects_tampered_state(self):
        res = new_client().get("/auth/oauth/github/callback?code=abc&state=tampered", follow_redirects=False)
        assert "/login?error=oauth_state" in res.headers["location"]

    def test_callback_rejects_missing_nonce_cookie(self):
        settings = get_settings()
        with patch.object(settings, "github_client_id", "cid"), patch.object(settings, "github_client_secret", "sec"):
            start = new_client().get("/auth/oauth/github/start", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
        res = new_client().get(f"/auth/oauth/github/callback?code=abc&state={state}", follow_redirects=False)
        assert "/login?error=oauth_state" in res.headers["location"]

    def test_callback_creates_user_and_links_by_verified_email(self):
        settings = get_settings()
        email, _ = signup(new_client())  # existing password account
        c = new_client()
        with patch.object(settings, "github_client_id", "cid"), patch.object(settings, "github_client_secret", "sec"):
            start = c.get("/auth/oauth/github/start?next=/app", follow_redirects=False)
            state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
            profile = {"id": "gh-42", "email": email, "email_verified": True, "name": "GH", "avatar_url": None}
            with patch("app.auth._fetch_profile", new=AsyncMock(return_value=profile)):
                res = c.get(f"/auth/oauth/github/callback?code=abc&state={state}", follow_redirects=False)
        assert res.headers["location"].endswith("/app")
        me = c.get("/auth/me").json()
        assert me["email"] == email and me["providers"] == ["github"] and me["has_password"] is True

    def test_open_redirect_blocked(self):
        settings = get_settings()
        with patch.object(settings, "github_client_id", "cid"), patch.object(settings, "github_client_secret", "sec"):
            c = new_client()
            start = c.get("/auth/oauth/github/start?next=//evil.example.com", follow_redirects=False)
            state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
            profile = {"id": f"gh-{uuid.uuid4().hex}", "email": f"{uuid.uuid4().hex[:8]}@example.com",
                       "email_verified": True, "name": "", "avatar_url": None}
            with patch("app.auth._fetch_profile", new=AsyncMock(return_value=profile)):
                res = c.get(f"/auth/oauth/github/callback?code=abc&state={state}", follow_redirects=False)
        assert res.headers["location"] == f"{settings.frontend_url}/app"


# ─── Cases ───────────────────────────────────────────────────────────────

class TestCases:
    def test_requires_login(self):
        assert new_client().get("/cases").status_code == 401
        assert new_client().post("/cases", data={"problem_description": "I cannot make payroll"}).status_code == 401

    def test_create_list_get_delete(self, mock_llm):
        c = new_client()
        signup(c)
        created = c.post("/cases", data={"problem_description": "I can't make payroll this Friday.", "state": "Ohio"})
        assert created.status_code == 201
        case = created.json()
        assert case["title"] == "Cannot make payroll this Friday"
        assert case["category"] == "cash_flow_management"
        assert [m["role"] for m in case["messages"]] == ["user", "assistant"]
        assert case["messages"][1]["advisory"]["urgency"] == "critical"
        assert case["context"] == {"state": "Ohio"}

        listing = c.get("/cases").json()
        assert listing[0]["id"] == case["id"] and listing[0]["message_count"] == 2
        assert c.get(f"/cases/{case['id']}").status_code == 200
        assert c.delete(f"/cases/{case['id']}").status_code == 204
        assert c.get(f"/cases/{case['id']}").status_code == 404

    def test_followup_uses_whole_thread_and_saved_context(self, mock_llm):
        c = new_client()
        signup(c)
        case = c.post("/cases", data={"problem_description": "I can't make payroll this Friday.",
                                      "business_type": "Agency"}).json()
        updated = c.post(f"/cases/{case['id']}/messages", data={"content": "Payroll is $32k, we have $10k."}).json()
        assert len(updated["messages"]) == 4
        sent = mock_llm.call_args.args[0]
        assert "I can't make payroll this Friday." in sent
        assert "Payroll is $32k" in sent
        assert "Business type: Agency" in sent

    def test_users_cannot_see_each_others_cases(self, mock_llm):
        alice, bob = new_client(), new_client()
        signup(alice)
        signup(bob)
        case = alice.post("/cases", data={"problem_description": "Alice's private tax problem"}).json()
        assert bob.get(f"/cases/{case['id']}").status_code == 404
        assert bob.delete(f"/cases/{case['id']}").status_code == 404
        assert bob.post(f"/cases/{case['id']}/messages", data={"content": "hello there"}).status_code == 404
        assert all(x["id"] != case["id"] for x in bob.get("/cases").json())

    def test_rename(self, mock_llm):
        c = new_client()
        signup(c)
        case = c.post("/cases", data={"problem_description": "I can't make payroll this Friday."}).json()
        res = c.patch(f"/cases/{case['id']}", json={"title": "Payroll crunch"})
        assert res.json()["title"] == "Payroll crunch"

    def test_fallback_does_not_overwrite_routing(self, mock_llm):
        c = new_client()
        signup(c)
        case = c.post("/cases", data={"problem_description": "I can't make payroll this Friday."}).json()
        mock_llm.side_effect = ValueError("bad json")  # → malformed twice → fallback response
        updated = c.post(f"/cases/{case['id']}/messages", data={"content": "more details here"}).json()
        assert updated["messages"][-1]["advisory"]["model_used"] == "none"
        assert updated["category"] == "cash_flow_management"


def test_compose_description_drops_oldest_followups_first():
    turns = ["original " * 10, "a" * 30, "b" * 30, "c" * 30]
    text = compose_description(turns, limit=170)
    assert text.startswith("original")
    assert "c" * 30 in text and "a" * 30 not in text
