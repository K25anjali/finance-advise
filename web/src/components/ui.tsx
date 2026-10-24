import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { BRAND, STAMPS, type StampTone } from '../lib/meta'
import type { Urgency } from '../lib/types'
import { useUI } from '../store/useUI'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass'
import { MoonIcon, SunIcon } from './icons'

/**
 * The brand mark: one stroke draws an "L", then climbs out of its corner as a trend line
 * to an amber point; the ruled line underneath is the bottom line. `hero` sits on the dark bands.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 3.5V16.5L10.5 12l3 3L18 10.5" />
      <path d="M4.5 20.5h15" opacity="0.6" />
      <circle cx="18.6" cy="7.4" r="2.1" stroke="none" style={{ fill: 'var(--color-highlight)' }} />
    </svg>
  )
}

/** "Un" in orange, "tangle" in green; read as one word by screen readers. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx('ll-wordmark', className)} aria-label={BRAND}>
      <span className="ll-wordmark__un" aria-hidden="true">
        {BRAND.slice(0, 2)}
      </span>
      <span className="ll-wordmark__rest" aria-hidden="true">
        {BRAND.slice(2)}
      </span>
    </span>
  )
}

/** Rounded tile with the mark, plus the wordmark. */
export function Logo({
  tone = 'ink',
  size = 'md',
  wordmark = true,
  className,
}: {
  tone?: 'ink' | 'hero'
  size?: 'sm' | 'md' | 'lg'
  wordmark?: boolean
  className?: string
}) {
  return (
    <span className={clsx('ll-logo', `ll-logo--${tone}`, `ll-logo--${size}`, className)}>
      <span className="ll-logo__tile">
        <LogoMark />
      </span>
      {wordmark && <Wordmark className="ll-logo__word" />}
    </span>
  )
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

/** Icon-only control: the label is required, because there is no visible text. */
export function IconButton({
  label,
  size = 36,
  className,
  type = 'button',
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & { label: string; size?: 36 | 40 }) {
  return (
    <button type={type} aria-label={label} title={label} className={clsx('ll-icon-btn', size === 40 && 'll-icon-btn--40', className)} {...rest}>
      {children}
    </button>
  )
}

/**
 * When to act, in one of three colours.
 * pill: chip with a dot (chat, cards) · tag: squared label (legends) · stamp: rotated, bordered rubber stamp.
 */
export function UrgencyStamp({
  urgency,
  tone,
  shape = 'pill',
  label,
  className,
}: {
  urgency?: Urgency
  tone?: StampTone
  shape?: 'pill' | 'tag' | 'stamp'
  label?: string
  className?: string
}) {
  const s = urgency ? STAMPS[urgency] : null
  const t = tone ?? s?.tone ?? 'when-ready'
  const text = (label ?? s?.text ?? TONE_TEXT[t]).toUpperCase()
  return (
    <span className={clsx('ll-stamp', `ll-stamp--${shape}`, `ll-stamp--${t}`, className)} title={s ? `Urgency: ${s.spoken}` : undefined}>
      {shape === 'pill' && <span className="ll-stamp__dot" aria-hidden="true" />}
      {text}
    </span>
  )
}

const TONE_TEXT: Record<StampTone, string> = { 'act-today': 'Act today', 'this-week': 'This week', 'when-ready': 'When ready' }

/** 8px dot in the urgency colour, for dense lists. */
export function UrgencyDot({ urgency }: { urgency: Urgency | null }) {
  const s = urgency ? STAMPS[urgency] : null
  return (
    <span className={clsx('ll-dot', s && `ll-dot--${s.tone}`)} title={s?.text}>
      {s && <span className="sr-only">Urgency: {s.spoken}</span>}
    </span>
  )
}

/** Mono account code on a tint chip: 110. */
export function AccountCode({ code, className }: { code: string; className?: string }) {
  return <span className={clsx('ll-code', className)}>{code}</span>
}

/** Label above, 52px input below. `aside` sits at the right of the label row (e.g. "Forgot it?"). */
export function TextField({
  id,
  label,
  aside,
  trailing,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: ReactNode; aside?: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={clsx('ll-field', className)}>
      {aside ? (
        <div className="ll-field__row">
          <label htmlFor={id} className="ll-field__label">
            {label}
          </label>
          {aside}
        </div>
      ) : (
        <label htmlFor={id} className="ll-field__label">
          {label}
        </label>
      )}
      {trailing ? (
        <div className="ll-field__wrap">
          <input id={id} className="ll-input ll-input--trailing" {...input} />
          {trailing}
        </div>
      ) : (
        <input id={id} className="ll-input" {...input} />
      )}
    </div>
  )
}

function initials(name: string) {
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  )
}

export function Avatar({ name, src, size = 34, className }: { name: string; src?: string | null; size?: 28 | 34; className?: string }) {
  return src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" className={clsx('ll-avatar', `ll-avatar--${size}`, className)} />
  ) : (
    <span className={clsx('ll-avatar', `ll-avatar--${size}`, className)} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** One toggle for every page; the choice persists under `untangle-mode`. */
export function ThemeToggle({ className }: { className?: string }) {
  const mode = useUI((s) => s.mode)
  const toggle = useUI((s) => s.toggleMode)
  const dark = mode === 'dark'
  return (
    <button type="button" onClick={toggle} className={clsx('ll-theme-toggle', className)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}

/** Mono status line, used wherever we'd otherwise reach for a spinner. */
export function Printing({ children }: { children: string }) {
  return (
    <span className="ll-printing" role="status">
      {children}
      <span className="ll-printing__caret" aria-hidden="true" />
    </span>
  )
}
