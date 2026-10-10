import uuid
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.models import (
    AdvisoryRequest,
    AdvisoryResponse,
    ErrorResponse,
    CATEGORY_DESCRIPTIONS,
)
from app import auth, cases
from app.advisor import classify_and_advise
from app.db import init_db
from app.http_utils import extract_file_content, rate_limiter
from app.fallbacks import build_rate_limited_response, build_validation_error_response

# ─── Logging Setup ────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Startup / Shutdown ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Startup and shutdown events."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("AI Financial Advisory Service starting up")
    logger.info(f"  Provider: {settings.llm_provider}")
    logger.info(f"  Model: {settings.primary_model}")
    logger.info(f"  Fallback: {settings.fallback_model}")
    logger.info(f"  Rate limit: {settings.rate_limit_requests} req/{settings.rate_limit_window_seconds}s")
    logger.info(f"  API key configured: {'Yes' if settings.active_api_key else f'NO — SET {settings.llm_provider.upper()}_API_KEY!'}")
    if settings.secret_key.startswith("dev-insecure"):
        logger.warning("  SECRET_KEY is the dev default — set a random one before deploying!")
    logger.info("=" * 60)
    init_db()
    yield


# ─── App Setup ────────────────────────────────────────────────────────────

app = FastAPI(
    lifespan=lifespan,
    title="AI Financial Advisory Service",
    description=(
        "An AI-powered triage service for small business financial problems. "
        "Submit a free-text problem description and receive structured advice "
        "with classification, urgency assessment, and recommended next steps."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — cookies need an explicit origin (a "*" origin can't carry credentials).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_url.rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(cases.router)


# ─── Routes ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "ok",
        "service": "ai-financial-advisor",
        "version": "1.0.0",
    }


@app.get("/categories", tags=["Advisory"])
async def list_categories():
    """List all advisory categories with descriptions and examples."""
    return {
        "categories": {
            cat.value: {
                "name": meta["name"],
                "description": meta["description"],
                "examples": meta["examples"],
                "default_urgency": meta["default_urgency"],
            }
            for cat, meta in CATEGORY_DESCRIPTIONS.items()
        },
        "total": len(CATEGORY_DESCRIPTIONS),
    }


@app.post(
    "/advise",
    response_model=AdvisoryResponse,
    responses={
        429: {"model": ErrorResponse, "description": "Rate limited"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        503: {"model": ErrorResponse, "description": "LLM service unavailable"},
    },
    tags=["Advisory"],
    summary="Analyze a business problem and get structured financial advice",
)
async def advise(
    http_request: Request,
    problem_description: str = Form(
        ...,
        min_length=10,
        max_length=5000,
        description="Free-text description of your business problem",
    ),
    business_type: Optional[str] = Form(default=None, description="Type of business"),
    annual_revenue: Optional[str] = Form(default=None, description="Approximate annual revenue"),
    state: Optional[str] = Form(default=None, description="US state"),
    urgency_hint: Optional[str] = Form(default=None, description="Your sense of urgency"),
    file: Optional[UploadFile] = File(default=None, description="Optional: PDF or TXT document"),
):
    """
    Submit a messy, free-text business problem and receive:
    - **Classification** into a financial advisory category
    - **Extracted fields** a human advisor would need
    - **Urgency assessment** and confidence score
    - **Recommended next action** with rationale
    - **Follow-up questions** to refine the advice

    Accepts an optional file upload (PDF or TXT) for additional context.
    """
    request_id = str(uuid.uuid4())

    # ── Rate limiting ──
    client_ip = http_request.client.host if http_request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip):
        logger.warning(f"Rate limited | ip={client_ip} | request_id={request_id}")
        error_resp = build_rate_limited_response(request_id)
        return JSONResponse(status_code=429, content=error_resp.model_dump())

    # ── Extract file content if provided ──
    file_content = None
    if file and file.filename:
        file_content = await extract_file_content(file)
        logger.info(f"File uploaded | filename={file.filename} | size={len(file_content or '')} chars")

    # ── Build request ──
    advisory_request = AdvisoryRequest(
        problem_description=problem_description,
        business_type=business_type,
        annual_revenue=annual_revenue,
        state=state,
        urgency_hint=urgency_hint,
    )

    # ── Process ──
    logger.info(
        f"Processing advisory request | request_id={request_id} | "
        f"input_length={len(problem_description)} | has_file={file_content is not None}"
    )

    response = await classify_and_advise(advisory_request, file_content=file_content)
    return response


@app.post(
    "/advise/json",
    response_model=AdvisoryResponse,
    responses={
        429: {"model": ErrorResponse, "description": "Rate limited"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        503: {"model": ErrorResponse, "description": "LLM service unavailable"},
    },
    tags=["Advisory"],
    summary="Analyze a business problem (JSON input, no file upload)",
)
async def advise_json(
    http_request: Request,
    request: AdvisoryRequest,
):
    """
    Same as /advise but accepts JSON body instead of form data.
    Use this endpoint when you don't need file upload.

    Example:
    ```json
    {
        "problem_description": "I got an IRS notice about unpaid 2023 taxes",
        "business_type": "restaurant",
        "state": "California"
    }
    ```
    """
    request_id = str(uuid.uuid4())

    # ── Rate limiting ──
    client_ip = http_request.client.host if http_request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip):
        logger.warning(f"Rate limited | ip={client_ip} | request_id={request_id}")
        error_resp = build_rate_limited_response(request_id)
        return JSONResponse(status_code=429, content=error_resp.model_dump())

    logger.info(
        f"Processing advisory request (JSON) | request_id={request_id} | "
        f"input_length={len(request.problem_description)}"
    )

    response = await classify_and_advise(request)
    return response

