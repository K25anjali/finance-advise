import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import clsx from 'clsx'
import { ApiError, auth } from '../lib/api'
import { BRAND } from '../lib/meta'
import { useAuth } from '../store/useAuth'
import { GitHubIcon, GoogleIcon, Logo, ThemeToggle } from '../components/ui'
import { Guilloche } from '../components/landing/Guilloche'
import { Stamp } from '../components/app/Stamp'

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
// Weak is the only red: it's the one state that needs acting on.
const STRENGTH = [
  { label: 'Too short', color: 'var(--stamp-red)' },
  { label: 'Weak', color: 'var(--stamp-red)' },
  { label: 'Okay', color: 'var(--graphite)' },
  { label: 'Good', color: 'var(--ledger-green)' },
  { label: 'Strong', color: 'var(--ledger-green)' },
]

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const status = useAuth((s) => s.status)
  const providers = useAuth((s) => s.providers)
  const login = useAuth((s) => s.login)
  const signup = useAuth((s) => s.signup)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/app'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(() => OAUTH_ERRORS[params.get('error') ?? ''] ?? null)

  if (status === 'authed') return <Navigate to={next} replace />

  const isSignup = mode === 'signup'
  const pwScore = strength(password)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (isSignup && password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    try {
      if (isSignup) await signup(email, password, name)
      else await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col px-4 py-4 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle className="-mr-2" />
        </div>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <p className="t-label">{isSignup ? 'New account' : 'Returning'}</p>
          <h1 className="t-h1 mt-2 sm:text-[32px] sm:leading-[40px]">{isSignup ? 'Open your case file' : 'Back to the drawer'}</h1>
          <p className="mt-2 text-graphite">
            {isSignup ? 'An account keeps every case on file, so you can pick any of them up later.' : 'Sign in to pick up where you left off.'}
          </p>

          <div className="mt-8 grid gap-2">
            <OAuthButton provider="google" enabled={providers.google} next={next}>
              <GoogleIcon /> Continue with Google
            </OAuthButton>
            <OAuthButton provider="github" enabled={providers.github} next={next}>
              <GitHubIcon /> Continue with GitHub
            </OAuthButton>
          </div>

          <div className="t-label my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-rule-strong" /> or with email <span className="h-px flex-1 bg-rule-strong" />
          </div>

          <form onSubmit={submit} className="grid gap-5" noValidate>
            {isSignup && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Jordan Lee"
                  maxLength={200}
                  className="line-field"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                required
                className="line-field"
              />
            </Field>
            <Field
              label="Password"
              trailing={
                <button type="button" onClick={() => setShow((v) => !v)} className="t-label hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? 'Hide' : 'Show'}
                </button>
              }
            >
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                required
                className="line-field"
              />
            </Field>

            {isSignup && password && (
              <div className="-mt-2 flex items-center gap-3">
                <div className="flex flex-1 gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-[3px] flex-1" style={{ background: i < pwScore ? STRENGTH[pwScore].color : 'var(--rule)' }} />
                  ))}
                </div>
                <span className="t-label w-20 text-right" style={{ color: STRENGTH[password.length < 8 ? 0 : pwScore].color }}>
                  {password.length < 8 ? STRENGTH[0].label : STRENGTH[pwScore].label}
                </span>
              </div>
            )}

            {error && (
              <p role="alert" className="t-sm border-l-2 border-carbon pl-3 text-ink">
                <span aria-hidden>ⓘ </span>
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || !email || !password} className="btn btn-primary mt-1 w-full">
              {busy ? 'Checking…' : isSignup ? 'Open the file' : 'Sign in'}
            </button>
          </form>

          <p className="t-sm mt-6 text-graphite">
            {isSignup ? 'Already have a file? ' : `New to ${BRAND}? `}
            <Link to={`${isSignup ? '/login' : '/signup'}${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">
              {isSignup ? 'Sign in' : 'Open a case file'}
            </Link>
          </p>
        </div>

        <p className="t-fine text-center">AI-generated triage, not professional financial advice.</p>
      </div>

      {/* A specimen of what comes back, built from the same primitives as the real entry */}
      <div className="relative hidden overflow-hidden border-l border-rule-strong bg-sheet lg:block">
        <Guilloche className="pointer-events-none absolute -right-48 -bottom-48 size-[720px] opacity-60" />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <div className="max-w-[460px]">
            <p className="t-label">What comes back</p>
            <div className="paper-shadow mt-4">
              <p className="receipt torn-bottom px-5 pt-3 text-ink">
                <span className="t-machine block text-graphite">RECEIVED 14:32</span>
                Two clients are <mark className="hl">60 days late</mark> and payroll is <mark className="hl">Friday</mark>.
              </p>
            </div>
            <div className="sheet mt-6 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <span className="t-label">110 · Cash Flow</span>
                <Stamp urgency="critical" seed="auth-specimen" />
              </div>
              <p className="t-h2 mt-3">Friday payroll is at risk because receivables are 60 days overdue.</p>
              <div className="double-rule mt-5" />
              <p className="t-label mt-3">The bottom line</p>
              <p className="mt-1 font-voice text-[18px] leading-[26px]">Call both clients today for payment by Thursday, and ask your bank about a short-term line.</p>
            </div>
          </div>
        </div>
      </div>
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
      className={clsx('btn btn-ink w-full', !enabled && 'pointer-events-auto cursor-not-allowed opacity-45 hover:!bg-transparent hover:!text-ink')}
    >
      {children}
    </a>
  )
}

function Field({ label, trailing, children }: { label: string; trailing?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="t-label">{label}</span>
        {trailing}
      </span>
      {children}
    </label>
  )
}
