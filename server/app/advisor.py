"""
Core advisory logic — the brain of the service.
Orchestrates: prompt building → LLM call → validation → response.

Supports two providers behind one call (LLM_PROVIDER = "anthropic" | "openai"); both
use schema-constrained JSON output, so the rest of the pipeline is provider-agnostic.
"""

import json
import time
import uuid
import logging
from typing import Optional

import anthropic
import openai
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings
from app.models import AdvisoryRequest, AdvisoryResponse, LLMRawOutput
from app.prompts import SYSTEM_PROMPT, build_user_prompt
from app.fallbacks import (
    circuit_breaker,
    validate_and_fix_llm_output,
    build_response_from_llm,
    build_fallback_response,
)

logger = logging.getLogger(__name__)

# Transient errors worth retrying with backoff. Auth / bad-request errors are NOT here:
# a wrong API key won't fix itself, so retrying just adds latency.
TRANSIENT_ERRORS = (
    openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError, openai.InternalServerError,
    anthropic.RateLimitError, anthropic.APITimeoutError, anthropic.APIConnectionError, anthropic.InternalServerError,
)
# Any provider API failure (transient or not) — triggers the fallback model / circuit breaker.
PROVIDER_ERRORS = (openai.APIError, anthropic.APIError)

# Sonnet 5.5 supports server-side refusal fallbacks; Haiku does not.
_SERVER_FALLBACK_MODELS = {"claude-sonnet-5-5"}


# ─── Provider Clients (lazy init) ────────────────────────────────────────

_openai_client: Optional[openai.AsyncOpenAI] = None
_anthropic_client: Optional[anthropic.AsyncAnthropic] = None


def get_openai_client() -> openai.AsyncOpenAI:
    """Lazy-initialized async OpenAI client."""
    global _openai_client
    if _openai_client is None:
        settings = get_settings()
        _openai_client = openai.AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=settings.llm_timeout_seconds,
            max_retries=0,  # tenacity owns retries (avoids SDK retries × our retries)
        )
    return _openai_client


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Lazy-initialized async Anthropic client."""
    global _anthropic_client
    if _anthropic_client is None:
        settings = get_settings()
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key or None,  # None → SDK resolves env / `ant auth` profile
            timeout=settings.llm_timeout_seconds,
            max_retries=0,
        )
    return _anthropic_client


# ─── LLM JSON Schema for Structured Output ──────────────────────────────

LLM_JSON_SCHEMA = {
    "name": "advisory_analysis",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "thinking": {
                "type": "string",
                "description": "Step-by-step reasoning about the user's problem before classifying",
            },
            "category": {
                "type": "string",
                "enum": [
                    "tax_compliance",
                    "cash_flow_management",
                    "funding_and_capital",
                    "bookkeeping_and_accounting",
                    "business_structure",
                    "insurance_and_risk",
                    "unclear",
                ],
                "description": "The advisory category",
            },
            "confidence": {
                "type": "number",
                "description": "Confidence in classification 0.0-1.0",
            },
            "primary_issue": {
                "type": "string",
                "description": "Core problem in one sentence",
            },
            "financial_amount": {
                "anyOf": [{"type": "string"}, {"type": "null"}],
                "description": "Any dollar amounts mentioned",
            },
            "deadline": {
                "anyOf": [{"type": "string"}, {"type": "null"}],
                "description": "Any deadlines or time constraints",
            },
            "entities_involved": {
                "type": "array",
                "items": {"type": "string"},
                "description": "People, orgs, or agencies mentioned",
            },
            "prior_actions": {
                "anyOf": [{"type": "string"}, {"type": "null"}],
                "description": "What the user has already tried",
            },
            "urgency": {
                "type": "string",
                "enum": ["critical", "high", "medium", "low"],
                "description": "Urgency assessment",
            },
            "has_sufficient_info": {
                "type": "boolean",
                "description": "Enough info to give actionable advice?",
            },
            "missing_information": {
                "type": "array",
                "items": {"type": "string"},
                "description": "What additional info would help",
            },
            "recommended_action": {
                "type": "string",
                "description": "Clear next step",
            },
            "rationale": {
                "type": "string",
                "description": "Why classified this way",
            },
            "follow_up_questions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "2-3 follow-up questions",
            },
        },
        "required": [
            "thinking",
            "category",
            "confidence",
            "primary_issue",
            "financial_amount",
            "deadline",
            "entities_involved",
            "prior_actions",
            "urgency",
            "has_sufficient_info",
            "missing_information",
            "recommended_action",
            "rationale",
            "follow_up_questions",
        ],
        "additionalProperties": False,
    },
}


# ─── LLM Calls ──────────────────────────────────────────────────────────

async def _call_openai(user_message: str, model: str) -> str:
    settings = get_settings()
    response = await get_openai_client().chat.completions.create(
        model=model,
        temperature=settings.llm_temperature,
        max_tokens=settings.llm_max_tokens,
        response_format={"type": "json_schema", "json_schema": LLM_JSON_SCHEMA},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or ""


async def _call_anthropic(user_message: str, model: str) -> str:
    settings = get_settings()
    request = dict(
        model=model,
        max_tokens=settings.anthropic_max_tokens,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        output_config={
            "effort": settings.anthropic_effort,
            "format": {"type": "json_schema", "schema": LLM_JSON_SCHEMA["schema"]},
        },
    )
    client = get_anthropic_client()
    if model in _SERVER_FALLBACK_MODELS:
        # If a safety classifier declines, the API re-runs the request on a fallback model in the same call.
        response = await client.beta.messages.create(
            **request, betas=["server-side-fallback-2026-07-01"], fallbacks="default"
        )
    else:
        response = await client.messages.create(**request)

    # Refusals and truncation come back as HTTP 200 — treat them as malformed output.
    if response.stop_reason == "refusal":
        raise ValueError(f"Model declined the request (category={getattr(response.stop_details, 'category', None)})")
    if response.stop_reason == "max_tokens":
        raise ValueError("Model output truncated at max_tokens")
    # Adaptive thinking may emit thinking blocks first; the JSON answer is the text block.
    return next((b.text for b in response.content if b.type == "text"), "")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type(TRANSIENT_ERRORS),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def _call_llm(user_message: str, model: str) -> tuple[LLMRawOutput, int]:
    """
    Make a single LLM call with structured output on the configured provider.
    Returns the parsed output and processing time in ms.
    Retries up to 3 times with exponential backoff on transient errors.
    """
    settings = get_settings()
    start = time.time()

    if settings.llm_provider == "anthropic":
        content = await _call_anthropic(user_message, model)
    else:
        content = await _call_openai(user_message, model)

    elapsed_ms = int((time.time() - start) * 1000)

    if not content:
        raise ValueError("LLM returned empty content")

    raw_data = json.loads(content)
    raw_output = LLMRawOutput(**raw_data)

    logger.info(
        f"LLM call completed | provider={settings.llm_provider} | model={model} | "
        f"category={raw_output.category} | confidence={raw_output.confidence:.2f} | latency={elapsed_ms}ms"
    )

    return raw_output, elapsed_ms


# ─── Main Advisory Function ─────────────────────────────────────────────

async def classify_and_advise(
    request: AdvisoryRequest,
    file_content: Optional[str] = None,
) -> AdvisoryResponse:
    """
    Main entry point: takes a messy problem description, returns structured advice.

    Flow:
    1. Check circuit breaker
    2. Build prompt
    3. Call LLM (with retries)
    4. Validate & post-process output
    5. Build response
    """
    settings = get_settings()
    request_id = str(uuid.uuid4())

    # ── Step 1: Circuit breaker check ──
    if not circuit_breaker.can_proceed():
        logger.warning(f"Circuit breaker OPEN — returning fallback | request_id={request_id}")
        return build_fallback_response(
            request_id=request_id,
            error_message="Circuit breaker open — LLM provider experiencing issues",
        )

    # ── Step 2: Build prompt ──
    user_message = build_user_prompt(
        problem_description=request.problem_description,
        business_type=request.business_type,
        annual_revenue=request.annual_revenue,
        state=request.state,
        urgency_hint=request.urgency_hint,
        file_content=file_content,
    )

    # ── Step 3: Call LLM ──
    model = settings.primary_model
    try:
        raw_output, elapsed_ms = await _call_llm(user_message, model)
        circuit_breaker.record_success()

    except PROVIDER_ERRORS as e:
        circuit_breaker.record_failure()
        logger.error(f"LLM call failed after retries | error={e} | request_id={request_id}")

        # Try fallback model if primary failed and breaker is still allowing
        if circuit_breaker.can_proceed() and model != settings.fallback_model:
            logger.info(f"Trying fallback model: {settings.fallback_model}")
            try:
                raw_output, elapsed_ms = await _call_llm(
                    user_message, settings.fallback_model
                )
                model = settings.fallback_model
                circuit_breaker.record_success()
            except Exception as fallback_err:
                circuit_breaker.record_failure()
                logger.error(f"Fallback model also failed | error={fallback_err}")
                return build_fallback_response(
                    request_id=request_id,
                    error_message=f"Both primary and fallback models failed: {e}",
                )
        else:
            return build_fallback_response(
                request_id=request_id,
                error_message=f"LLM provider error: {e}",
            )

    except (json.JSONDecodeError, ValueError) as e:
        # Malformed LLM output — try once more before fallback
        logger.error(f"Failed to parse LLM output | error={e} | request_id={request_id}")
        try:
            raw_output, elapsed_ms = await _call_llm(user_message, model)
        except Exception:
            return build_fallback_response(
                request_id=request_id,
                error_message=f"Malformed LLM output after retry: {e}",
            )

    except Exception as e:
        logger.error(f"Unexpected error in LLM call | error={e} | request_id={request_id}")
        return build_fallback_response(
            request_id=request_id,
            error_message=f"Unexpected error: {e}",
        )

    # ── Step 4: Validate & post-process ──
    raw_output = validate_and_fix_llm_output(raw_output)

    # ── Step 5: Build response ──
    response = build_response_from_llm(
        raw=raw_output,
        request_id=request_id,
        processing_time_ms=elapsed_ms,
        model_used=model,
    )

    # Log the result (metadata only, no PII)
    logger.info(
        f"Advisory complete | request_id={request_id} | category={response.category.value} | "
        f"confidence={response.confidence} | urgency={response.urgency.value} | "
        f"latency={elapsed_ms}ms | model={model} | sufficient_info={response.has_sufficient_info}"
    )

    return response
