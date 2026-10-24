import type {
  AdvisoryRequest,
  AdvisoryResponse,
  CaseContext,
  CaseDetail,
  CaseSummary,
  CategoriesResponse,
  HealthResponse,
  Providers,
  User,
} from './types'

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly retryAfter?: number

  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // non-JSON error body
  }
  const b = body as { detail?: unknown; error?: string; retry_after_seconds?: number } | null

  if (res.status === 429) {
    const msg = typeof b?.detail === 'string' ? b.detail : 'Too many requests. Wait a moment and try again.'
    return new ApiError(msg, 429, b?.retry_after_seconds ?? 60)
  }
  if (res.status === 422 && Array.isArray(b?.detail)) {
    const first = b.detail[0] as { msg?: string; loc?: string[] }
    const field = first?.loc?.at(-1)?.replace(/_/g, ' ')
    const msg = (first?.msg ?? 'Invalid input').replace(/^Value error, /, '')
    return new ApiError(field && field !== 'body' ? `${field}: ${msg}` : msg, 422)
  }
  if (typeof b?.detail === 'string') return new ApiError(b.detail, res.status)
  return new ApiError(b?.error ?? 'Something went wrong on our side. Please try again.', res.status)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    // credentials: include → the session cookie also rides along when the API is on another origin.
    res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...init })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError("Can't reach Untangle right now. Check your connection and try again.", 0)
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

const json = (body: unknown, method = 'POST'): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

function form(fields: Record<string, string | undefined>, file?: File | null): FormData {
  const f = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value.trim() !== '') f.append(key, value.trim())
  }
  if (file) f.append('file', file)
  return f
}

// ── Public ──
export const getHealth = (signal?: AbortSignal) => request<HealthResponse>('/health', { signal })
export const getCategories = () => request<CategoriesResponse>('/categories')
export const adviseAnonymous = (req: AdvisoryRequest, file?: File | null) =>
  request<AdvisoryResponse>('/advise', { method: 'POST', body: form({ ...req }, file) })

// ── Auth ──
export const auth = {
  me: () => request<User>('/auth/me'),
  providers: () => request<Providers>('/auth/providers'),
  signup: (email: string, password: string, name: string) => request<User>('/auth/signup', json({ email, password, name })),
  login: (email: string, password: string) => request<User>('/auth/login', json({ email, password })),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  /** Full-page navigation — the provider redirects back to /app when done. */
  oauthUrl: (provider: 'google' | 'github', next = '/app') =>
    `${API_BASE}/auth/oauth/${provider}/start?next=${encodeURIComponent(next)}`,
}

// ── Cases ──
export const cases = {
  list: () => request<CaseSummary[]>('/cases'),
  get: (id: string, signal?: AbortSignal) => request<CaseDetail>(`/cases/${id}`, { signal }),
  create: (description: string, context: CaseContext, file?: File | null, signal?: AbortSignal) =>
    request<CaseDetail>('/cases', {
      method: 'POST',
      body: form({ problem_description: description, ...context }, file),
      signal,
    }),
  reply: (id: string, content: string, file?: File | null, signal?: AbortSignal) =>
    request<CaseDetail>(`/cases/${id}/messages`, { method: 'POST', body: form({ content }, file), signal }),
  rename: (id: string, title: string) => request<CaseSummary>(`/cases/${id}`, json({ title }, 'PATCH')),
  remove: (id: string) => request<void>(`/cases/${id}`, { method: 'DELETE' }),
}
