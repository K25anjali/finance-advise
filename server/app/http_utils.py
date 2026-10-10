"""Shared HTTP helpers: in-memory rate limiting and uploaded-document text extraction."""

import io
import logging
import time
from collections import defaultdict
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.config import get_settings

logger = logging.getLogger(__name__)


# ─── Simple In-Memory Rate Limiter ───────────────────────────────────────

class RateLimiter:
    """
    In-memory rate limiter using sliding window.
    Production note: Replace with Redis-based limiter for multi-instance deployment.
    """

    def __init__(self, limit: Optional[int] = None, window_seconds: Optional[int] = None):
        self.requests: dict[str, list[float]] = defaultdict(list)
        self._limit = limit
        self._window = window_seconds

    def is_rate_limited(self, client_ip: str) -> bool:
        settings = get_settings()
        now = time.time()
        window = self._window or settings.rate_limit_window_seconds
        limit = self._limit or settings.rate_limit_requests

        # Clean old entries
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < window
        ]

        if len(self.requests[client_ip]) >= limit:
            return True

        self.requests[client_ip].append(now)
        return False


rate_limiter = RateLimiter()  # LLM-backed endpoints
auth_rate_limiter = RateLimiter(limit=10, window_seconds=60)  # login / signup attempts per IP


# ─── File Content Extraction ─────────────────────────────────────────────

async def extract_file_content(file: UploadFile) -> Optional[str]:
    """
    Extract text content from an uploaded file.
    Supports .txt and .pdf files.
    """
    settings = get_settings()

    if not file.filename:
        return None

    # Check file size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_bytes // (1024*1024)}MB.",
        )

    filename_lower = file.filename.lower()

    if filename_lower.endswith(".txt"):
        return content.decode("utf-8", errors="replace")

    elif filename_lower.endswith(".pdf"):
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts) if text_parts else None
        except Exception as e:
            logger.warning(f"Failed to parse PDF: {e}")
            raise HTTPException(
                status_code=422,
                detail="Could not read the PDF file. Please try a text file instead.",
            )

    else:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type: {file.filename}. Supported: .txt, .pdf",
        )
