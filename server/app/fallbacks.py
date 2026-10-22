"""
Error handling, circuit breaker, and graceful degradation.
This module handles what happens when the LLM is unreliable:
- API down or rate-limited → circuit breaker + graceful response
- Malformed model output → validation fallback
- Low confidence → flag and adjust
"""

import time
import logging
import uuid
from typing import Optional

from app.config import get_settings
from app.models import (
    AdvisoryCategory,
    AdvisoryResponse,
    ErrorResponse,
    ExtractedFields,
    LLMRawOutput,
    UrgencyLevel,
)

logger = logging.getLogger(__name__)


# ─── Circuit Breaker ──────────────────────────────────────────────────────

class CircuitBreaker:
    """
    Simple circuit breaker to stop hammering a failing LLM provider.

    States:
    - CLOSED (normal): requests go through
    - OPEN (tripped): requests are blocked, return fallback
    - HALF-OPEN: after cooldown, allow one request to test if provider recovered

    Not thread-safe for simplicity — fine for single-instance local dev.
    For production, use Redis-backed state.
    """

    def __init__(self):
        settings = get_settings()
        self.failure_threshold = settings.circuit_breaker_failure_threshold
        self.window_seconds = settings.circuit_breaker_window_seconds
        self.cooldown_seconds = settings.circuit_breaker_cooldown_seconds
        self.failures: list[float] = []  # timestamps of recent failures
        self.opened_at: Optional[float] = None
        self.state = "closed"

    def record_failure(self):
        """Record a failure and potentially trip the breaker."""
        now = time.time()
        self.failures.append(now)
        # Only count failures within the window
        self.failures = [t for t in self.failures if now - t < self.window_seconds]

        if len(self.failures) >= self.failure_threshold:
            self.state = "open"
            self.opened_at = now
            logger.warning(
                f"Circuit breaker OPENED after {len(self.failures)} failures "
                f"in {self.window_seconds}s. Cooldown: {self.cooldown_seconds}s"
            )

    def record_success(self):
        """Record a success — close the breaker if it was half-open."""
        if self.state == "half_open":
            logger.info("Circuit breaker CLOSED — provider recovered")
        self.state = "closed"
        self.failures = []
        self.opened_at = None

    def can_proceed(self) -> bool:
        """Check if a request should be allowed through."""
        if self.state == "closed":
            return True

        if self.state == "open":
            # Check if cooldown has elapsed
            if self.opened_at and time.time() - self.opened_at > self.cooldown_seconds:
                self.state = "half_open"
                logger.info("Circuit breaker HALF-OPEN — allowing test request")
                return True
            return False

        # half_open: allow one request
        return True

    def get_retry_after(self) -> int:
        """Seconds until the circuit breaker will allow another attempt."""
        if self.state != "open" or not self.opened_at:
            return 0
        elapsed = time.time() - self.opened_at
        remaining = max(0, self.cooldown_seconds - elapsed)
        return int(remaining) + 1


# Singleton circuit breaker instance
circuit_breaker = CircuitBreaker()


# ─── Graceful Degradation Responses ──────────────────────────────────────

def build_service_unavailable_response(request_id: str) -> ErrorResponse:
    """Response when the LLM provider is down or circuit breaker is open."""
    return ErrorResponse(
        request_id=request_id,
        error="AI advisory service is temporarily unavailable",
        error_type="llm_unavailable",
        recommended_action=(
            "Our AI service is temporarily unavailable. Please try again in a few minutes, "
            "or contact a financial advisor directly. You can find certified advisors at "
            "SCORE.org (free) or through your local Small Business Development Center (SBDC)."
        ),
        retry_after_seconds=circuit_breaker.get_retry_after(),
    )


def build_rate_limited_response(request_id: str) -> ErrorResponse:
    """Response when the user has exceeded rate limits."""
    return ErrorResponse(
        request_id=request_id,
        error="Rate limit exceeded",
        error_type="rate_limited",
        recommended_action="You've sent too many requests. Please wait a moment and try again.",
        retry_after_seconds=60,
    )


def build_validation_error_response(request_id: str, detail: str) -> ErrorResponse:
    """Response for input validation failures."""
    return ErrorResponse(
        request_id=request_id,
        error=detail,
        error_type="validation_error",
        recommended_action="Please check your input and try again. The problem description should be 10-5000 characters.",
    )


# ─── LLM Output Post-Processing ─────────────────────────────────────────

def validate_and_fix_llm_output(raw: LLMRawOutput) -> LLMRawOutput:
    """
    Post-process the LLM's structured output to handle edge cases:
    - Unknown category → fallback to "other"
    - Confidence out of range → clamp to [0, 1]
    - Unknown urgency → fallback to "medium"
    """
    settings = get_settings()

    # Fix category if it's not in our enum
    valid_categories = [c.value for c in AdvisoryCategory]
    if raw.category not in valid_categories:
        logger.warning(f"LLM returned unknown category '{raw.category}', falling back to 'other'")
        raw.category = AdvisoryCategory.OTHER.value
        raw.confidence = min(raw.confidence, 0.3)  # Force low confidence on fallback

    # Clamp confidence
    raw.confidence = max(0.0, min(1.0, raw.confidence))

    # If confidence is too low, override to "other"
    if raw.confidence < settings.confidence_low_threshold and raw.category != AdvisoryCategory.OTHER.value:
        logger.info(
            f"Overriding category from '{raw.category}' to 'other' — "
            f"confidence {raw.confidence:.2f} below threshold {settings.confidence_low_threshold}"
        )
        raw.category = AdvisoryCategory.OTHER.value

    # Fix urgency if it's not valid
    valid_urgencies = [u.value for u in UrgencyLevel]
    if raw.urgency not in valid_urgencies:
        logger.warning(f"LLM returned unknown urgency '{raw.urgency}', falling back to 'medium'")
        raw.urgency = UrgencyLevel.MEDIUM.value

    return raw


def build_response_from_llm(
    raw: LLMRawOutput,
    request_id: str,
    processing_time_ms: int,
    model_used: str,
) -> AdvisoryResponse:
    """Convert validated LLM output into our API response schema."""
    settings = get_settings()

    return AdvisoryResponse(
        request_id=request_id,
        processing_time_ms=processing_time_ms,
        model_used=model_used,
        category=AdvisoryCategory(raw.category),
        confidence=round(raw.confidence, 3),
        low_confidence_flag=raw.confidence < settings.confidence_medium_threshold,
        extracted_fields=ExtractedFields(
            primary_issue=raw.primary_issue,
            financial_amount=raw.financial_amount,
            deadline=raw.deadline,
            entities_involved=raw.entities_involved,
            prior_actions=raw.prior_actions,
        ),
        urgency=UrgencyLevel(raw.urgency),
        has_sufficient_info=raw.has_sufficient_info,
        missing_information=raw.missing_information,
        recommended_action=raw.recommended_action,
        rationale=raw.rationale,
        follow_up_questions=raw.follow_up_questions,
    )


def build_fallback_response(
    request_id: str,
    error_message: str,
    processing_time_ms: int = 0,
    model_used: str = "none",
) -> AdvisoryResponse:
    """
    Last-resort response when LLM fails completely after retries.
    Returns a valid AdvisoryResponse with 'other' category so the API
    contract is maintained even during failures.
    """
    logger.warning(f"Serving fallback response | request_id={request_id} | reason={error_message}")
    return AdvisoryResponse(
        request_id=request_id,
        processing_time_ms=processing_time_ms,
        model_used=model_used,
        category=AdvisoryCategory.OTHER,
        confidence=0.0,
        low_confidence_flag=True,
        extracted_fields=ExtractedFields(
            primary_issue="Unable to process — AI service encountered an error",
        ),
        urgency=UrgencyLevel.MEDIUM,
        has_sufficient_info=False,
        missing_information=["Unable to analyze the request at this time"],
        recommended_action=(
            "Our AI analysis service encountered a temporary issue. "
            "Please try again shortly. For immediate help, visit SCORE.org "
            "for free business advisory services or contact your local SBDC."
        ),
        # The real error stays in server logs (logged above with the request_id);
        # never echo provider error bodies, keys or request ids to end users.
        rationale=(
            "We couldn't reach the AI analysis service, so this is a safe automated response — "
            f"your description wasn't analysed. Reference: {request_id[:8]}"
        ),
        follow_up_questions=[
            "Could you describe your most pressing financial concern?",
            "Is there a specific deadline or urgency driving this request?",
            "Have you consulted with a financial advisor before about this issue?",
        ],
    )
