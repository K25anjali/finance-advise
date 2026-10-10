import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react'
import clsx from 'clsx'
import { ApiError, auth } from '../lib/api'
import { useAuth } from '../store/useAuth'
import { GitHubIcon, GoogleIcon, Logo, Spinner, ThemeToggle } from '../components/ui'
import { DemoCard } from '../components/landing/DemoCard'

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
const STRENGTH = [
  { label: 'Too short', color: '#F0524F' },
  { label: 'Weak', color: '#F08A3E' },
  { label: 'Okay', color: '#D9B13B' },
  { label: 'Good', color: '#3FB57F' },
  { label: 'Strong', color: '#3FB57F' },
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-[42px] leading-none tracking-tight">
              {isSignup ? 'Open your case file' : 'Welcome back'}
            </h1>
            <p className="mt-3 text-sm text-ink-2">
              {isSignup
                ? 'Create an account to save every case and pick up any thread later.'
                : 'Sign in to continue where you left off.'}
            </p>

            <div className="mt-8 grid gap-2.5">
              <OAuthButton provider="google" enabled={providers.google} next={next}>
                <GoogleIcon /> Continue with Google
              </OAuthButton>
              <OAuthButton provider="github" enabled={providers.github} next={next}>
                <GitHubIcon /> Continue with GitHub
              </OAuthButton>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] text-ink-3">
              <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="grid gap-3" noValidate>
              {isSignup && (
                <Field icon={<UserIcon />} label="Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Jordan Lee"
                    maxLength={200}
                    className="w-full bg-transparent outline-none placeholder:text-ink-3"
                  />
                </Field>
              )}
              <Field icon={<Mail />} label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  className="w-full bg-transparent outline-none placeholder:text-ink-3"
                />
              </Field>
              <Field
                icon={<Lock />}
                label="Password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="text-ink-3 hover:text-ink"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                  className="w-full bg-transparent outline-none placeholder:text-ink-3"
                />
              </Field>

              {isSignup && password && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{ background: i < pwScore ? STRENGTH[pwScore].color : 'var(--line)' }}
                      />
                    ))}
                  </div>
                  <span className="w-16 text-right text-[11px]" style={{ color: STRENGTH[pwScore].color }}>
                    {password.length < 8 ? STRENGTH[0].label : STRENGTH[pwScore].label}
                  </span>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-[13px] text-ink-2"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={busy || !email || !password}
                className="group mt-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink transition-all hover:brightness-110 disabled:opacity-40"
              >
                {busy ? <Spinner /> : isSignup ? 'Create account' : 'Sign in'}
                {!busy && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-3">
              {isSignup ? 'Already have an account? ' : 'New to Ledgerline? '}
              <Link
                to={`${isSignup ? '/login' : '/signup'}${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent"
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </motion.div>
        </div>

        <p className="text-center text-[11px] text-ink-3">
          AI-generated triage, not professional financial advice.
        </p>
      </div>

      {/* Showcase side */}
      <div className="relative hidden overflow-hidden border-l border-line bg-panel lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 70% 20%, color-mix(in srgb, var(--accent) 16%, transparent), transparent), radial-gradient(50% 50% at 20% 90%, #F2735A1f, transparent)',
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <div className="label">A real case, start to finish</div>
          <p className="mt-3 max-w-md font-display text-[34px] leading-[1.1] tracking-tight">
            “Two clients are 60 days late and payroll is Friday.” <em className="text-ink-3">Here's what happens next.</em>
          </p>
          <div className="mt-10 max-w-lg">
            <DemoCard />
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
      className={clsx(
        'flex items-center justify-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-medium transition-all',
        enabled ? 'hover:border-line-strong hover:bg-panel-2' : 'cursor-not-allowed opacity-45',
      )}
    >
      {children}
    </a>
  )
}

function Field({
  icon,
  label,
  trailing,
  children,
}: {
  icon: ReactNode
  label: string
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-2/50 px-3.5 py-3 text-sm transition-colors focus-within:border-accent [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-ink-3">
        {icon}
        {children}
        {trailing}
      </span>
    </label>
  )
}
