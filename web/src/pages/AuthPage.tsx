import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import clsx from 'clsx'
import { ApiError, auth } from '../lib/api'
import { BRAND } from '../lib/meta'
import { useAuth } from '../store/useAuth'
import { AccountCode, Logo, TextField, ThemeToggle, UrgencyStamp } from '../components/ui'
import { buttonClass } from '../components/buttonClass'
import { CheckIcon, GitHubIcon, GoogleIcon, LockIcon, TrashIcon } from '../components/icons'
import '../styles/auth.css'

const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelled: 'Sign-in was cancelled.',
  oauth_state: 'That sign-in link expired. Please try again.',
  oauth_failed: "We couldn't complete sign-in with that provider. Please try again.",
  oauth_no_email: 'Your account has no verified email we can use. Add one with the provider, or sign up with email.',
  google_not_configured: "Google sign-in isn't set up on this server yet.",
  github_not_configured: "GitHub sign-in isn't set up on this server yet.",
}

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score)
}
const STRENGTH = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

/** Where the chat composer picks up the business name as its default context. */
const BUSINESS_KEY = 'll_business'

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const status = useAuth((s) => s.status)
  const providers = useAuth((s) => s.providers)
  const login = useAuth((s) => s.login)
  const signup = useAuth((s) => s.signup)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/app'

  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(() => OAUTH_ERRORS[params.get('error') ?? ''] ?? null)
  const [info, setInfo] = useState<string | null>(null)

  if (status === 'authed') return <Navigate to={next} replace />

  const isSignup = mode === 'signup'
  const pwScore = password.length < 8 ? 0 : pwScore4(password)
  const switchTo = `${isSignup ? '/login' : '/signup'}${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (isSignup && password.length < 8) return setError('Use at least 8 characters for your password.')
    if (isSignup && !agreed) return setError('Tick the box to confirm you understand this is AI triage, not professional advice.')
    setBusy(true)
    try {
      if (isSignup) {
        await signup(email, password, name)
        if (business.trim()) {
          try {
            localStorage.setItem(BUSINESS_KEY, business.trim())
          } catch {
            // storage blocked: the composer just starts without it
          }
        }
      } else await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const showToggle = (
    <button type="button" onClick={() => setShow((v) => !v)} className="au-show" aria-label={show ? 'Hide password' : 'Show password'}>
      {show ? 'Hide' : 'Show'}
    </button>
  )

  const notices = (
    <>
      {info && (
        <p role="status" className="au-alert">
          {info}
        </p>
      )}
      {error && (
        <p role="alert" className="au-alert au-alert--error">
          {error}
        </p>
      )}
    </>
  )

  const divider = (
    <div className="au-divider">
      <span />
      OR WITH EMAIL
      <span />
    </div>
  )

  if (!isSignup) {
    return (
      <div className="au-page">
        <main className="au-main">
          <div className="au-brandrow">
            <Link to="/" className="au-logo-link" aria-label={`${BRAND} home`}>
              <Logo tone="ink" size="md" />
            </Link>
            <ThemeToggle />
          </div>

          <div className="au-center">
            <form onSubmit={submit} className="au-form" noValidate>
              <div className="au-head">
                <span className="au-eyebrow">RETURNING</span>
                <h1 className="au-h1">Back to the drawer</h1>
                <p className="au-sub">Sign in to pick up where you left off.</p>
              </div>

              <div className="au-oauth">
                <OAuthButton provider="google" enabled={providers.google} next={next}>
                  <GoogleIcon /> Continue with Google
                </OAuthButton>
                <OAuthButton provider="github" enabled={providers.github} next={next}>
                  <GitHubIcon /> Continue with GitHub
                </OAuthButton>
              </div>

              {divider}

              <TextField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@business.com"
                required
              />
              <TextField
                id="login-pass"
                label="Password"
                aside={
                  <button
                    type="button"
                    className="au-linkbtn"
                    onClick={() => {
                      setError(null)
                      setInfo("Password resets aren't available yet. Sign in with Google or GitHub if you used them, or contact support.")
                    }}
                  >
                    Forgot it?
                  </button>
                }
                trailing={showToggle}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />

              {notices}

              <button type="submit" disabled={busy || !email || !password} className={buttonClass('primary', 52)}>
                {busy ? 'Checking…' : 'Sign in'}
              </button>

              <p className="au-switch">
                New to {BRAND}? <Link to={switchTo}>Open a case file</Link>
              </p>
            </form>
          </div>
          <p className="au-foot">AI-generated triage, not professional financial advice.</p>
        </main>

        <aside className="au-aside on-hero" aria-label="What comes back">
          <svg viewBox="0 0 700 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="au-bg">
            <g fill="none" strokeWidth="1.4" className="au-contours">
              <path d="M-20 700 C 140 620, 260 760, 420 660 S 640 560, 760 620" />
              <path d="M-20 660 C 140 580, 260 720, 420 620 S 640 520, 760 580" />
              <path d="M-20 620 C 140 540, 260 680, 420 580 S 640 480, 760 540" />
              <path d="M-20 580 C 140 500, 260 640, 420 540 S 640 440, 760 500" />
              <path d="M-20 540 C 140 460, 260 600, 420 500 S 640 400, 760 460" />
              <path d="M-20 200 C 160 140, 300 260, 460 180 S 660 100, 760 140" />
              <path d="M-20 160 C 160 100, 300 220, 460 140 S 660 60, 760 100" />
              <path d="M-20 120 C 160 60, 300 180, 460 100 S 660 20, 760 60" />
            </g>
            <circle cx="600" cy="140" r="90" className="au-circle" />
          </svg>
          <span className="au-aside__eyebrow">WHAT COMES BACK</span>
          <div className="au-bubble">
            <span className="au-bubble__time">RECEIVED 14:32</span>
            <p>
              Two clients are <mark>60 days late</mark> and payroll is <mark>Friday</mark>.
            </p>
          </div>
          <div className="au-card">
            <div className="au-card__head">
              <span className="au-card__acct">
                <AccountCode code="110" className="au-code-plain" />
                <span className="au-card__acct-name">CASH FLOW</span>
              </span>
              <UrgencyStamp tone="act-today" className="au-chip-lg" />
            </div>
            <p className="au-card__title">Friday payroll is at risk because receivables are 60 days overdue.</p>
            <div className="au-card__bottom">
              <span className="au-card__label">
                <CheckIcon size={12} strokeWidth={3} /> THE BOTTOM LINE
              </span>
              <p>Call both clients today for payment by Thursday, and ask your bank about a short-term line.</p>
            </div>
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="au-page au-page--signup">
      <aside className="au-illus" aria-label={`About ${BRAND}`}>
        <svg viewBox="0 0 700 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="au-bg">
          <defs>
            <pattern id="au-sg" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" strokeWidth="1" className="au-grid" />
            </pattern>
          </defs>
          <rect width="700" height="960" fill="url(#au-sg)" />
          <circle cx="640" cy="860" r="220" className="au-blob-2" />
          <circle cx="80" cy="120" r="90" className="au-blob-1" />
        </svg>
        <Link to="/" className="au-logo-link au-rel" aria-label={`${BRAND} home`}>
          <Logo tone="ink" size="md" />
        </Link>

        <div className="au-illus__body">
          <h2 className="au-illus__h2">Every mess has an account. Yours is waiting.</h2>
          <div className="au-rows">
            <CaseRow code="110" name="Cash Flow" tone="act-today" shift={28} />
            <CaseRow code="210" name="Tax Compliance" tone="this-week" />
            <CaseRow code="410" name="Business Structure" tone="when-ready" shift={14} />
          </div>
        </div>

        <div className="au-notes">
          <span>
            <LockIcon size={16} />
            Private to your account
          </span>
          <span>
            <TrashIcon size={16} />
            Delete any case, any time
          </span>
        </div>
      </aside>

      <main className="au-main au-main--signup">
        <ThemeToggle className="au-toggle" />
        <form onSubmit={submit} className="au-form au-form--signup" noValidate>
          <div className="au-head">
            <span className="au-eyebrow">NEW HERE</span>
            <h1 className="au-h1">Open a case file</h1>
            <p className="au-sub">Your first case takes about as long as typing it out.</p>
          </div>

          <div className="au-oauth au-oauth--pair">
            <OAuthButton provider="google" enabled={providers.google} next={next}>
              <GoogleIcon />
              Google
            </OAuthButton>
            <OAuthButton provider="github" enabled={providers.github} next={next}>
              <GitHubIcon />
              GitHub
            </OAuthButton>
          </div>

          {divider}

          <div className="au-names">
            <TextField
              id="su-name"
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Anjali Kumari"
              maxLength={200}
            />
            <TextField
              id="su-biz"
              label={
                <>
                  Business <span className="au-optional">(optional)</span>
                </>
              }
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              autoComplete="organization"
              placeholder="Corner Café LLC"
              maxLength={200}
            />
          </div>
          <TextField
            id="su-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@business.com"
            required
          />
          <div className="au-pass">
            <TextField
              id="su-pass"
              label="Password"
              trailing={showToggle}
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
            <div className="au-strength">
              <div className="au-meter" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={clsx(password && i < Math.max(pwScore, 1) && 'is-on')} />
                ))}
              </div>
              <span className="au-strength__word" aria-live="polite">
                {password ? STRENGTH[pwScore] : ''}
              </span>
            </div>
          </div>

          <label htmlFor="su-terms" className="au-terms">
            <input id="su-terms" type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I understand Untangle gives AI-generated triage, not professional financial, tax or legal advice.
          </label>

          {notices}

          <button type="submit" disabled={busy || !email || !password} className={buttonClass('primary', 52)}>
            {busy ? 'Checking…' : 'Create my drawer'}
          </button>
          <p className="au-switch">
            Already have one? <Link to={switchTo}>Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  )
}

/** Strength 1–4 once the password is long enough; "Too short" (0) below 8 characters. */
function pwScore4(pw: string) {
  return Math.max(1, strength(pw))
}

function CaseRow({ code, name, tone, shift }: { code: string; name: string; tone: 'act-today' | 'this-week' | 'when-ready'; shift?: number }) {
  return (
    <div className="au-row" style={shift ? { transform: `translateX(${shift}px)` } : undefined}>
      <AccountCode code={code} className="au-code-plain" />
      <span className="au-row__name">{name}</span>
      <UrgencyStamp tone={tone} shape="tag" className="au-row__chip" />
    </div>
  )
}

function OAuthButton({
  provider,
  enabled,
  next,
  children,
}: {
  provider: 'google' | 'github'
  enabled: boolean
  next: string
  children: ReactNode
}) {
  return (
    <a
      href={enabled ? auth.oauthUrl(provider, next) : undefined}
      aria-disabled={!enabled}
      title={enabled ? undefined : `${provider === 'google' ? 'Google' : 'GitHub'} sign-in isn't configured on this server`}
      className="au-oauth-btn"
    >
      {children}
    </a>
  )
}
