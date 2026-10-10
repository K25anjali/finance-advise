import { Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useUI } from '../store/useUI'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <path d="M9 21.5h14M9 16h9M9 10.5h14" className="stroke-bg" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22" cy="16" r="2.4" className="fill-accent" />
    </svg>
  )
}

export function Logo({ sub = true }: { sub?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <div className="font-display text-[22px] tracking-tight">Ledgerline</div>
        {sub && <div className="label mt-0.5 !text-[9.5px]">AI financial triage</div>}
      </div>
    </div>
  )
}

export function Avatar({ name, src, className = 'size-8' }: { name: string; src?: string | null; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" className={clsx('rounded-full object-cover', className)} />
  ) : (
    <span
      className={clsx(
        'grid place-items-center rounded-full bg-gradient-to-br from-accent/80 to-accent/40 text-[11px] font-semibold text-accent-ink',
        className,
      )}
    >
      {initials || '?'}
    </span>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUI((s) => s.theme)
  const toggle = useUI((s) => s.toggleTheme)
  return (
    <button onClick={toggle} className={clsx('chip !p-2', className)} aria-label="Toggle theme" title="Toggle theme">
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

export function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3a7.2 7.2 0 0 1-10.71-3.78H1.35v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.35a12 12 0 0 0 0 10.8l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.35 6.6l4.01 3.1A7.15 7.15 0 0 1 12 4.77z" />
    </svg>
  )
}

export function GitHubIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  )
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('animate-spin', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-panel-2 px-1.5 font-mono text-[10px] text-ink-3">{children}</kbd>
}
