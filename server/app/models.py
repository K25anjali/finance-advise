
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


# ─── Advisory Categories (Our Routing Table) ───────────────────────────────

class AdvisoryCategory(str, Enum):
    """The categories our service can route requests to."""
    TAX_COMPLIANCE = "tax_compliance"
    CASH_FLOW_MANAGEMENT = "cash_flow_management"
    FUNDING_AND_CAPITAL = "funding_and_capital"
    BOOKKEEPING_AND_ACCOUNTING = "bookkeeping_and_accounting"
    BUSINESS_STRUCTURE = "business_structure"
    INSURANCE_AND_RISK = "insurance_and_risk"
    UNCLEAR = "unclear"


class UrgencyLevel(str, Enum):
    """Urgency assessment levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ─── Category Metadata (for /categories endpoint and prompt grounding) ─────

CATEGORY_DESCRIPTIONS = {
    AdvisoryCategory.TAX_COMPLIANCE: {
        "name": "Tax Compliance",
        "description": "Tax filing, IRS notices, back taxes, estimated payments, tax deadlines, sales tax, payroll tax.",
        "examples": [
            "I got an IRS notice about unpaid 2023 taxes",
            "When is the deadline for filing my LLC taxes?",
            "I haven't paid sales tax in 6 months",
        ],
        "default_urgency": "high",
    },
    AdvisoryCategory.CASH_FLOW_MANAGEMENT: {
        "name": "Cash Flow Management",
        "description": "Payroll issues, late invoices, seasonal revenue dips, accounts receivable, operating expenses.",
        "examples": [
            "I can't make payroll this Friday",
            "Clients are paying 60-90 days late",
            "Revenue drops 40% every winter",
        ],
        "default_urgency": "high",
    },
    AdvisoryCategory.FUNDING_AND_CAPITAL: {
        "name": "Funding & Capital",
        "description": "Business loans, investor pitches, equipment financing, SBA loans, lines of credit, grants.",
        "examples": [
            "I need a loan to buy a delivery truck",
            "How do I pitch investors for my startup?",
            "Are there SBA grants for minority-owned businesses?",
        ],
        "default_urgency": "medium",
    },
    AdvisoryCategory.BOOKKEEPING_AND_ACCOUNTING: {
        "name": "Bookkeeping & Accounting",
        "description": "Messy books, finding a CPA, reconciliation, financial statements, QuickBooks setup.",
        "examples": [
            "My books are a mess, I need to get organized",
            "How do I reconcile my bank statements?",
            "Do I need a CPA or can I use software?",
        ],
        "default_urgency": "low",
    },
    AdvisoryCategory.BUSINESS_STRUCTURE: {
        "name": "Business Structure",
        "description": "LLC vs S-Corp, partnership agreements, entity formation, restructuring, operating agreements.",
        "examples": [
            "Should I switch from sole prop to LLC?",
            "My partner wants to leave, what happens to the business?",
            "What's the difference between LLC and S-Corp for taxes?",
        ],
        "default_urgency": "low",
    },
    AdvisoryCategory.INSURANCE_AND_RISK: {
        "name": "Insurance & Risk",
        "description": "Business liability, workers compensation, professional insurance, risk management, coverage gaps.",
        "examples": [
            "Do I need liability insurance for my food truck?",
            "An employee got hurt on site, am I covered?",
            "What insurance does a consulting firm need?",
        ],
        "default_urgency": "medium",
    },
    AdvisoryCategory.UNCLEAR: {
        "name": "Unclear / Needs Clarification",
        "description": "The request is too vague, off-topic, or lacks sufficient detail to classify.",
        "examples": [
            "I need help with my business",
            "Things aren't going well",
        ],
        "default_urgency": "low",
    },
}


# ─── Request Schema ────────────────────────────────────────────────────────

class AdvisoryRequest(BaseModel):
    """What the user sends us — a messy problem description plus optional context."""

    problem_description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Free-text description of the business problem. Can be messy, informal, multi-topic.",
        examples=[
            "I got an IRS notice about unpaid 2023 taxes and I don't know what to do. My accountant quit last month.",
            "Cash flow is killing me. Clients pay late, I can't make payroll, and I need to buy new equipment.",
        ],
    )

    business_type: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Type of business, e.g. 'restaurant', 'SaaS startup', 'plumbing contractor'.",
        examples=["restaurant", "e-commerce store", "freelance designer"],
    )

    annual_revenue: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Approximate annual revenue range.",
        examples=["$50k-$100k", "Under $500k", "About $2M"],
    )

    state: Optional[str] = Field(
        default=None,
        max_length=50,
        description="US state where the business operates (tax rules vary by state).",
        examples=["California", "TX", "New York"],
    )

    urgency_hint: Optional[str] = Field(
        default=None,
        max_length=200,
        description="User's own sense of urgency.",
        examples=["urgent - deadline next week", "just exploring options", "need help ASAP"],
    )


# ─── Response Schema ───────────────────────────────────────────────────────

class ExtractedFields(BaseModel):
    """Key structured facts extracted from the free-text input that a human advisor would need."""

    primary_issue: str = Field(description="The core problem in one sentence")
    financial_amount: Optional[str] = Field(default=None, description="Any dollar amounts mentioned")
    deadline: Optional[str] = Field(default=None, description="Any deadlines or time constraints")
    entities_involved: list[str] = Field(default_factory=list, description="People, orgs, or agencies mentioned (e.g. 'IRS', 'business partner')")
    prior_actions: Optional[str] = Field(default=None, description="What the user has already tried or done")


class AdvisoryResponse(BaseModel):
    """What we return — a structured classification, assessment, and recommendation."""

    # ── Tracing / Observability ──
    request_id: str = Field(description="Unique request ID for tracing")
    processing_time_ms: int = Field(description="How long the LLM call took in milliseconds")
    model_used: str = Field(description="Which model processed this request")

    # ── Classification ──
    category: AdvisoryCategory = Field(description="The advisory category this request was routed to")
    confidence: float = Field(ge=0.0, le=1.0, description="Model's confidence in the classification (0.0-1.0)")
    low_confidence_flag: bool = Field(default=False, description="True if confidence is below the medium threshold")

    # ── Extracted Info ──
    extracted_fields: ExtractedFields = Field(description="Key structured facts extracted from the input")

    # ── Assessment ──
    urgency: UrgencyLevel = Field(description="Assessed urgency level")
    has_sufficient_info: bool = Field(description="Whether there's enough information to provide actionable advice")
    missing_information: list[str] = Field(default_factory=list, description="What additional info would help")

    # ── Recommendation ──
    recommended_action: str = Field(description="Clear, actionable next step for the user")
    rationale: str = Field(description="Why we classified and routed it this way")

    # ── Follow-up ──
    follow_up_questions: list[str] = Field(default_factory=list, description="Smart questions to ask the user next")
    disclaimer: str = Field(
        default="This is an AI-generated assessment and does not constitute professional financial advice. Please consult a qualified financial advisor for decisions affecting your business.",
        description="Legal disclaimer",
    )


# ─── Error Response ────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    """Returned when the service can't process the request."""

    request_id: str
    error: str
    error_type: str  # "validation_error", "llm_unavailable", "rate_limited", "internal_error"
    recommended_action: str
    retry_after_seconds: Optional[int] = None


# ─── LLM Internal Schema (what we ask the model to return) ─────────────────

class LLMRawOutput(BaseModel):
    """
    The raw structured output we request from the LLM.
    Includes a 'thinking' field to force chain-of-thought reasoning
    before the model commits to a classification.
    """

    thinking: str = Field(description="Step-by-step reasoning about the user's problem before classifying")
    category: str = Field(description="One of: tax_compliance, cash_flow_management, funding_and_capital, bookkeeping_and_accounting, business_structure, insurance_and_risk, unclear")
    confidence: float = Field(description="Confidence in the classification from 0.0 to 1.0")
    primary_issue: str = Field(description="The core problem in one sentence")
    financial_amount: Optional[str] = Field(default=None, description="Any dollar amounts mentioned")
    deadline: Optional[str] = Field(default=None, description="Any deadlines or time constraints mentioned")
    entities_involved: list[str] = Field(default_factory=list, description="People, organizations, or agencies mentioned")
    prior_actions: Optional[str] = Field(default=None, description="What the user has already tried")
    urgency: str = Field(description="One of: critical, high, medium, low")
    has_sufficient_info: bool = Field(description="Is there enough info to give actionable advice?")
    missing_information: list[str] = Field(default_factory=list, description="What additional information would help")
    recommended_action: str = Field(description="Clear, specific next step")
    rationale: str = Field(description="Why you classified and routed it this way")
    follow_up_questions: list[str] = Field(default_factory=list, description="2-3 smart follow-up questions")
