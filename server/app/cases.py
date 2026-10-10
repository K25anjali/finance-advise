"""
Case threads: a signed-in user's saved conversations.

Each user turn is analysed in the context of the whole thread — the original description plus every
follow-up detail — so answering the model's follow-up questions sharpens the next assessment.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.advisor import classify_and_advise
from app.auth import current_user
from app.config import get_settings
from app.db import Database, get_db, new_id, now_iso, parse_ts
from app.http_utils import extract_file_content, rate_limiter
from app.models import AdvisoryRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cases", tags=["Cases"])

_FOLLOWUP_HEADER = "\n\n## Follow-up details from the user\n"


# ─── Schemas ─────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    attachment_name: Optional[str] = None
    advisory: Optional[dict] = None
    created_at: datetime


class CaseSummary(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    urgency: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class CaseDetail(CaseSummary):
    context: dict
    messages: list[MessageOut]


class RenameBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)


# ─── Queries ─────────────────────────────────────────────────────────────

def _summary(row: dict, count: int) -> CaseSummary:
    return CaseSummary(
        id=row["id"], title=row["title"], category=row["category"], urgency=row["urgency"],
        created_at=parse_ts(row["created_at"]), updated_at=parse_ts(row["updated_at"]), message_count=count,
    )


def _messages(db: Database, case_id: str) -> list[dict]:
    return db.all("SELECT * FROM messages WHERE case_id = ? ORDER BY created_at, id", case_id)


def _detail(db: Database, case: dict) -> CaseDetail:
    msgs = _messages(db, case["id"])
    return CaseDetail(
        **_summary(case, len(msgs)).model_dump(),
        context=json.loads(case["context"] or "{}"),
        messages=[
            MessageOut(
                id=m["id"], role=m["role"], content=m["content"], attachment_name=m["attachment_name"],
                advisory=json.loads(m["advisory"]) if m["advisory"] else None,
                created_at=parse_ts(m["created_at"]),
            )
            for m in msgs
        ],
    )


def _own_case(db: Database, user: dict, case_id: str) -> dict:
    # Scoped by user_id in SQL: someone else's case is indistinguishable from a missing one.
    case = db.one("SELECT * FROM cases WHERE id = ? AND user_id = ?", case_id, user["id"])
    if case is None:
        raise HTTPException(404, "Case not found")
    return case


def compose_description(user_turns: list[str], limit: int) -> str:
    """Original description + follow-ups, dropping the oldest follow-ups first to fit `limit`."""
    first, followups = user_turns[0], user_turns[1:]
    while followups:
        text = first + _FOLLOWUP_HEADER + "\n\n".join(followups)
        if len(text) <= limit:
            return text
        followups = followups[1:]
    return first[:limit]


async def _run_turn(db: Database, user: dict, case: dict, text: str, file: Optional[UploadFile]) -> None:
    """Append a user turn, analyse the whole thread, append the assistant turn — one transaction."""
    settings = get_settings()
    if rate_limiter.is_rate_limited(f"user:{user['id']}"):
        raise HTTPException(429, "Too many requests — try again in a minute.")

    file_content = await extract_file_content(file) if file and file.filename else None
    prior = db.all("SELECT content FROM messages WHERE case_id = ? AND role = 'user' ORDER BY created_at, id", case["id"])
    ctx = json.loads(case["context"] or "{}")
    request = AdvisoryRequest(
        problem_description=compose_description([r["content"] for r in prior] + [text], settings.max_input_length),
        business_type=ctx.get("business_type"),
        annual_revenue=ctx.get("annual_revenue"),
        state=ctx.get("state"),
        urgency_hint=ctx.get("urgency_hint"),
    )
    response = await classify_and_advise(request, file_content=file_content)

    db.run(
        "INSERT INTO messages (id, case_id, role, content, attachment_name, created_at) VALUES (?, ?, 'user', ?, ?, ?)",
        new_id(), case["id"], text, file.filename if file_content else None, now_iso(),
    )
    db.run(
        "INSERT INTO messages (id, case_id, role, advisory, created_at) VALUES (?, ?, 'assistant', ?, ?)",
        new_id(), case["id"], response.model_dump_json(), now_iso(),
    )
    if response.model_used != "none":  # don't let a fallback overwrite a real routing
        db.run(
            """UPDATE cases SET category = ?, urgency = ?, updated_at = ?,
                                title = CASE WHEN title = 'New case' THEN ? ELSE title END
               WHERE id = ?""",
            response.category.value, response.urgency.value, now_iso(),
            response.extracted_fields.primary_issue[:200], case["id"],
        )
    else:
        db.run("UPDATE cases SET updated_at = ? WHERE id = ?", now_iso(), case["id"])
    db.commit()


# ─── Routes ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[CaseSummary])
def list_cases(user: dict = Depends(current_user), db: Database = Depends(get_db)):
    rows = db.all(
        """SELECT c.*, COUNT(m.id) AS message_count
           FROM cases c LEFT JOIN messages m ON m.case_id = c.id
           WHERE c.user_id = ?
           GROUP BY c.id, c.user_id, c.title, c.category, c.urgency, c.context, c.created_at, c.updated_at
           ORDER BY c.updated_at DESC""",
        user["id"],
    )
    return [_summary(r, r["message_count"]) for r in rows]


@router.post("", response_model=CaseDetail, status_code=201)
async def create_case(
    problem_description: str = Form(..., min_length=10, max_length=5000),
    business_type: Optional[str] = Form(default=None, max_length=200),
    annual_revenue: Optional[str] = Form(default=None, max_length=100),
    state: Optional[str] = Form(default=None, max_length=50),
    urgency_hint: Optional[str] = Form(default=None, max_length=200),
    file: Optional[UploadFile] = File(default=None),
    user: dict = Depends(current_user),
    db: Database = Depends(get_db),
):
    context = {k: v.strip() for k, v in {
        "business_type": business_type, "annual_revenue": annual_revenue,
        "state": state, "urgency_hint": urgency_hint,
    }.items() if v and v.strip()}

    case_id, now = new_id(), now_iso()
    db.run(
        "INSERT INTO cases (id, user_id, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        case_id, user["id"], json.dumps(context), now, now,
    )
    try:
        await _run_turn(db, user, db.one("SELECT * FROM cases WHERE id = ?", case_id), problem_description.strip(), file)
    except Exception:
        db.rollback()  # no empty case left behind if the turn fails
        raise
    case = db.one("SELECT * FROM cases WHERE id = ?", case_id)
    logger.info(f"Case created | case_id={case_id} | user_id={user['id']} | category={case['category']}")
    return _detail(db, case)


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(case_id: str, user: dict = Depends(current_user), db: Database = Depends(get_db)):
    return _detail(db, _own_case(db, user, case_id))


@router.post("/{case_id}/messages", response_model=CaseDetail)
async def add_message(
    case_id: str,
    content: str = Form(..., min_length=2, max_length=5000),
    file: Optional[UploadFile] = File(default=None),
    user: dict = Depends(current_user),
    db: Database = Depends(get_db),
):
    case = _own_case(db, user, case_id)
    await _run_turn(db, user, case, content.strip(), file)
    return _detail(db, _own_case(db, user, case_id))


@router.patch("/{case_id}", response_model=CaseSummary)
def rename_case(case_id: str, body: RenameBody, user: dict = Depends(current_user), db: Database = Depends(get_db)):
    _own_case(db, user, case_id)
    db.run("UPDATE cases SET title = ? WHERE id = ?", body.title.strip(), case_id)
    db.commit()
    case = _own_case(db, user, case_id)
    count = db.one("SELECT COUNT(*) AS n FROM messages WHERE case_id = ?", case_id)["n"]
    return _summary(case, count)


@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: str, user: dict = Depends(current_user), db: Database = Depends(get_db)):
    _own_case(db, user, case_id)
    db.run("DELETE FROM cases WHERE id = ? AND user_id = ?", case_id, user["id"])  # messages cascade
    db.commit()
