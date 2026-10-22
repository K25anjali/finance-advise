import clsx from 'clsx'
import { BRAND } from '../lib/meta'
import { useTheme, useUI } from '../store/useUI'

/** The auditor's sign-off: a tick over a double rule (design.md §6.13). */
export function Mark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M9 13.5l4 4 10-10" fill="none" stroke="var(--ledger-green)" strokeWidth="2.8" strokeLinecap="square" />
      <path d="M5 22.5h22M5 26h22" stroke="var(--margin-red)" strokeWidth="1.6" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <Mark />
      <span className="font-voice text-[20px] leading-none">{BRAND}</span>
    </span>
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
    <img src={src} alt="" referrerPolicy="no-referrer" className={clsx('rounded-[2px] object-cover', className)} />
  ) : (
    <span className={clsx('grid place-items-center rounded-[2px] border border-rule-strong font-label text-[11px] font-semibold text-graphite', className)}>
      {initials || '?'}
    </span>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const toggle = useUI((s) => s.toggleTheme)
  return (
    <button onClick={toggle} className={clsx('btn btn-quiet t-label', className)} title="Switch between desk and binding">
      {theme === 'dark' ? 'Desk' : 'Binding'}
      <span className="sr-only"> theme</span>
    </button>
  )
}

/** A staple, for attached files (design.md §2.3). */
export function Staple({ className = 'h-3 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 12" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 11V4.5h16V11" strokeLinecap="square" />
    </svg>
  )
}

/** Auditor's tick, or an open circle while the entry is still in pencil. */
export function Tick({ open = false, className = 'size-4' }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="var(--entry-tick, var(--ledger-green))" strokeWidth="1.8">
      {open ? <circle cx="8" cy="8" r="5" /> : <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />}
    </svg>
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

/** Machine-printed status line, used wherever we'd otherwise reach for a spinner. */
export function Printing({ children }: { children: string }) {
  return (
    <span className="t-machine text-graphite" role="status">
      {children}
      <span className="ml-0.5 inline-block w-[0.6em] animate-pulse">▌</span>
    </span>
  )
}
