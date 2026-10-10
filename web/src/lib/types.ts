// Mirrors server/app/models.py — keep in sync with the API contract.

export type Category =
  | 'tax_compliance'
  | 'cash_flow_management'
  | 'funding_and_capital'
  | 'bookkeeping_and_accounting'
  | 'business_structure'
  | 'insurance_and_risk'
  | 'unclear'

export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export interface AdvisoryRequest {
  problem_description: string
  business_type?: string
  annual_revenue?: string
  state?: string
  urgency_hint?: string
}

export interface ExtractedFields {
  primary_issue: string
  financial_amount: string | null
  deadline: string | null
  entities_involved: string[]
  prior_actions: string | null
}

export interface AdvisoryResponse {
  request_id: string
  processing_time_ms: number
  model_used: string
  category: Category
  confidence: number
  low_confidence_flag: boolean
  extracted_fields: ExtractedFields
  urgency: Urgency
  has_sufficient_info: boolean
  missing_information: string[]
  recommended_action: string
  rationale: string
  follow_up_questions: string[]
  disclaimer: string
}

export interface CategoryInfo {
  name: string
  description: string
  examples: string[]
  default_urgency: string
}

export interface CategoriesResponse {
  categories: Record<Category, CategoryInfo>
  total: number
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

// ── Accounts & saved cases ────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  has_password: boolean
  providers: string[]
}

export type Providers = Record<'google' | 'github', boolean>

export interface CaseSummary {
  id: string
  title: string
  category: Category | null
  urgency: Urgency | null
  created_at: string
  updated_at: string
  message_count: number
}

export interface CaseMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachment_name: string | null
  advisory: AdvisoryResponse | null
  created_at: string
}

export interface CaseContext {
  business_type?: string
  annual_revenue?: string
  state?: string
  urgency_hint?: string
}

export interface CaseDetail extends CaseSummary {
  context: CaseContext
  messages: CaseMessage[]
}
