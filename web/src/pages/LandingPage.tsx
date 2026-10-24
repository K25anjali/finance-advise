import { Link } from 'react-router'
import clsx from 'clsx'
import { ACCOUNTS, ACCOUNT_ORDER, BRAND, SUPPORT_EMAIL } from '../lib/meta'
import { useAuth } from '../store/useAuth'
import { AccountCode, Logo, ThemeToggle, UrgencyStamp, Wordmark } from '../components/ui'
import { buttonClass } from '../components/buttonClass'
import { ArrowRightIcon, CheckIcon } from '../components/icons'
import { Guilloche } from '../components/landing/Guilloche'
import '../styles/landing.css'

const TRUST = ['Plain-English answers', 'Asks before it guesses', 'Private to your account']

const STEPS = [
  {
    label: '01 — YOU',
    title: 'Empty the shoebox',
    text: 'Type it the way you’d say it: amounts, dates, who owes whom. Attach a notice or statement if you have one.',
    art: (
      <>
        <rect x="8" y="24" width="40" height="24" rx="4" style={{ fill: 'var(--color-accent)' }} />
        <path d="M6 24h44l-4-8H10z" style={{ fill: 'var(--color-accent-border)' }} />
        <rect x="16" y="8" width="14" height="18" rx="2" transform="rotate(-12 23 17)" style={{ fill: 'var(--color-surface)' }} />
        <rect x="27" y="6" width="13" height="18" rx="2" transform="rotate(10 33 15)" style={{ fill: 'var(--color-paper)' }} />
        <rect x="22" y="33" width="12" height="4" rx="2" style={{ fill: 'var(--color-on-accent)' }} />
      </>
    ),
  },
  {
    label: '02 — UNTANGLE',
    title: 'We sort it',
    text: 'We file it under the right account, pick out the facts that matter, and stamp how soon you need to act.',
    art: (
      <>
        <rect x="8" y="8" width="40" height="40" rx="6" style={{ fill: 'var(--color-surface)' }} />
        <rect x="14" y="16" width="16" height="4" rx="2" style={{ fill: 'var(--color-on-accent)' }} />
        <rect x="14" y="26" width="28" height="3" rx="1.5" style={{ fill: 'var(--color-border-strong)' }} />
        <rect x="14" y="33" width="28" height="3" rx="1.5" style={{ fill: 'var(--color-border-strong)' }} />
        <rect x="14" y="40" width="18" height="3" rx="1.5" style={{ fill: 'var(--color-border-strong)' }} />
        <circle cx="40" cy="18" r="6" style={{ fill: 'var(--color-highlight)' }} />
      </>
    ),
  },
  {
    label: '03 — YOU, AGAIN',
    title: 'Read the bottom line',
    text: 'One thing to do first, in plain words. If we need more, we ask instead of guessing.',
    art: (
      <>
        <circle cx="28" cy="28" r="20" style={{ fill: 'var(--color-accent)' }} />
        <path d="M19 28l6 6 12-13" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-on-accent)' }} />
        <path d="M12 52h32" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--color-highlight)' }} />
      </>
    ),
  },
]

const RULES = [
  { n: '01', title: 'Pencil until it’s ink', text: 'When we aren’t sure, we say so and mark the entry as pencilled in. Answer a question or two and we firm it up.' },
  { n: '02', title: 'Your words, kept', text: 'Your note stays on file exactly as you wrote it, next to the facts we took from it, so you can check we heard you right.' },
  { n: '03', title: 'Fails soft', text: 'If we can’t answer safely, you get a plain note and where to find free human help. Never a guess.' },
  { n: '04', title: 'Private by default', text: 'Your cases are visible to your account alone. Delete any of them, for good, whenever you like.' },
]

const WAVES_FRONT = [300, 330, 360]
const WAVES_BACK = [250, 390]
const wave = (y: number, lift: number) =>
  `M0 ${y} Q 150 ${y - lift} 300 ${y} T 600 ${y} T 900 ${y} T 1200 ${y} T 1500 ${y} T 1800 ${y} T 2100 ${y}`

function Tick({ className }: { className: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path className={className} d="M5 12l4 4L19 6" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function LandingPage() {
  const authed = useAuth((s) => s.status) === 'authed'
  const start = authed ? '/app' : '/signup'

  return (
    <div className="lp-page">
      {/* ── Hero (dark) ── */}
      <section className="lp-hero on-hero">
        <Guilloche className="lp-hero__bg" size={900} rings={26} />

        <header className="lp-nav">
          <Link to="/" className="lp-nav__home" aria-label={`${BRAND} home`}>
            <Logo tone="hero" size="lg" />
          </Link>
          <nav aria-label="Primary" className="lp-nav__pill">
            <a href="#how">How it works</a>
            <a href="#specimen">Example</a>
            <a href="#accounts">Accounts</a>
            <a href="#rules">Our rules</a>
          </nav>
          <div className="lp-nav__right">
            {!authed && (
              <Link to="/login" className="lp-nav__signin">
                Sign in
              </Link>
            )}
            <ThemeToggle />
            <Link to={start} className="lp-nav__start lp-lift">
              {authed ? 'Open your cases' : 'Start a case'}
            </Link>
          </div>
        </header>

        <div className="lp-hero__body">
          <div className="lp-hero__copy">
            <span className="lp-new lp-a-rise1">
              Financial triage for small businesses
            </span>
            <h1 className="lp-h1 lp-a-rise2">
              Bring the shoebox. Leave with the{' '}
              <span className="lp-h1__accent">
                bottom line.
                <svg className="lp-h1__underline" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
                  <path className="lp-a-draw" d="M4 6 C 120 2, 280 10, 396 5" fill="none" strokeWidth="3.5" strokeLinecap="round" />
                  <path className="lp-a-draw" d="M4 16 C 140 12, 260 19, 396 14" fill="none" strokeWidth="3.5" strokeLinecap="round" style={{ animationDelay: '.9s' }} />
                </svg>
              </span>
            </h1>
            <p className="lp-hero__p lp-a-rise3">
              Describe the money problem the way it is: tangled, half-remembered, in a hurry. {BRAND} files it under the right account, picks out the
              amounts and dates, tells you how soon to act, and writes the one thing to do next.
            </p>
            <div className="lp-hero__ctas lp-a-rise4">
              <Link to={start} className="lp-cta lp-a-glow">
                {authed ? 'Open your cases' : 'Start a case'}
                <ArrowRightIcon size={18} />
              </Link>
              <a href="#specimen" className="lp-cta-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5l12 7-12 7z" />
                </svg>
                See an example
              </a>
            </div>
            <div className="lp-trust lp-a-rise4">
              {TRUST.map((t) => (
                <span key={t}>
                  <CheckIcon size={16} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* The sorting machine: receipts get pulled into a ledger entry, on a 9s loop */}
          <div className="lp-machine" aria-hidden="true">
            <div className="lp-note lp-a-floatC">
              <div className="lp-note__meta">RECEIVED 14:32 · YOUR WORDS</div>
              <div className="lp-note__text">
                <span className="lp-a-type">I can’t make payroll this Friday. Help, please.</span>
              </div>
            </div>

            <div className="lp-a-suck1" style={{ position: 'absolute', left: '2%', top: 120 }}>
              <div className="lp-receipt lp-receipt--1 lp-a-floatA">
                <span className="lp-bar lp-bar--head" />
                <span className="lp-bar" style={{ width: '100%' }} />
                <span className="lp-bar" style={{ width: '80%' }} />
                <span className="lp-bar" style={{ width: '90%' }} />
                <span className="lp-price">$40,000</span>
              </div>
            </div>
            <div className="lp-a-suck2" style={{ position: 'absolute', left: '22%', top: 150 }}>
              <div className="lp-receipt lp-receipt--2 lp-a-floatB">
                <span className="lp-notice">NOTICE</span>
                <span className="lp-bar lp-bar--paper" style={{ width: '100%' }} />
                <span className="lp-bar lp-bar--paper" style={{ width: '70%' }} />
                <span className="lp-fri">FRI</span>
              </div>
            </div>
            <div className="lp-a-suck3" style={{ position: 'absolute', left: '6%', top: 320 }}>
              <div className="lp-receipt lp-receipt--3 lp-a-floatC">
                <span className="lp-bank">BANK · $11,000</span>
                <span className="lp-bar" style={{ width: '100%' }} />
                <span className="lp-bar" style={{ width: '60%' }} />
              </div>
            </div>

            <svg className="lp-arrow" viewBox="0 0 300 200">
              <path className="lp-a-flow" d="M10 20 C 110 30, 140 150, 270 160" fill="none" strokeWidth="3" strokeLinecap="round" />
              <path d="M258 148 l14 12 l-17 7" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="lp-card">
              <div className="lp-card__head">
                <span className="lp-card__acct">
                  <AccountCode code="110" />
                  <span className="lp-card__acct-name">CASH FLOW</span>
                </span>
                <span className="lp-card__stamp lp-a-stamp">ACT TODAY</span>
              </div>
              <div className="lp-card__title">Friday payroll for 8 employees is at risk.</div>
              <div className="lp-card__rows">
                <div className="lp-card__row lp-a-row1">
                  <span className="lp-card__row-k">Owed to you</span>
                  <span className="lp-card__row-v lp-mono">
                    $40,000
                    <Tick className="lp-a-tick1" />
                  </span>
                </div>
                <div className="lp-card__row lp-a-row2">
                  <span className="lp-card__row-k">Due</span>
                  <span className="lp-card__row-v">
                    This Friday
                    <Tick className="lp-a-tick2" />
                  </span>
                </div>
                <div className="lp-card__row lp-a-row3">
                  <span className="lp-card__row-k">On hand</span>
                  <span className="lp-card__row-v lp-mono">
                    $11,000
                    <Tick className="lp-a-tick3" />
                  </span>
                </div>
              </div>
              <div className="lp-card__rules">
                <span className="lp-rule lp-a-rule" />
                <span className="lp-rule lp-a-rule" style={{ animationDelay: '.15s' }} />
              </div>
              <div className="lp-card__bottom lp-a-line">
                <div className="lp-bl-label">THE BOTTOM LINE</div>
                <div className="lp-card__bottom-text">Call both clients today for payment by Thursday.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee__track lp-a-marquee">
          {[0, 1].map((set) => (
            <span key={set} className="lp-marquee__set">
              {ACCOUNT_ORDER.map((c) => (
                <span key={c} style={{ display: 'contents' }}>
                  <span>
                    <span className="lp-marquee__code">{ACCOUNTS[c].code}</span> {ACCOUNTS[c].name}
                  </span>
                  <span className="lp-marquee__dot" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how" className="lp-how">
        <div className="lp-section-head lp-rv">
          <h2 className="lp-h2 lp-how__h2">From shoebox to ledger in three moves.</h2>
          <p className="lp-lede lp-how__p">No forms, no categories to pick. You talk; we do the bookkeeping.</p>
        </div>
        <div className="lp-steps">
          <span className="lp-steps__line lp-rv-line" aria-hidden="true" />
          <div className="lp-steps__grid">
            {STEPS.map((s, i) => (
              <div key={s.label} className="lp-step lp-rv lp-lift">
                <span className="lp-step__tile lp-a-bob" style={{ animationDelay: `${i * 0.4}s` }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                    {s.art}
                  </svg>
                </span>
                <span className="lp-step__label">{s.label}</span>
                <h3 className="lp-step__title">{s.title}</h3>
                <p className="lp-step__text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specimen ── */}
      <section id="specimen" className="lp-specimen">
        <div className="lp-specimen__inner">
          <div className="lp-specimen__copy lp-rv">
            <span className="lp-eyebrow">EXAMPLE · ONE CASE</span>
            <h2 className="lp-specimen__h2">Your words go in as they are. A ledger entry comes out.</h2>
            <p className="lp-lede lp-specimen__p">
              We pick out the amounts, dates and people from your words. The stamp says when to act. Under the double line is the thing to do first.
            </p>
            <div className="lp-legend">
              <span className="lp-legend__row">
                <UrgencyStamp tone="act-today" shape="tag" />
                Within a day or two
              </span>
              <span className="lp-legend__row">
                <UrgencyStamp tone="this-week" shape="tag" />
                A deadline is close
              </span>
              <span className="lp-legend__row">
                <UrgencyStamp tone="when-ready" shape="tag" />
                Worth planning, not urgent
              </span>
            </div>
          </div>

          <div className="lp-specimen__main">
            <div className="lp-bubble lp-rv">
              <div className="lp-bubble__meta">RECEIVED 14:32 · 22 OCT 2026</div>
              <p>
                I can’t make payroll <mark>this Friday</mark>. Two clients owe me <mark>$40k</mark> combined and they’re 60 days late. I have{' '}
                <mark>8 employees</mark> and maybe <mark>$11,000</mark> in the account.
              </p>
            </div>
            <article className="lp-entry lp-rv">
              <UrgencyStamp tone="act-today" shape="stamp" className="lp-entry__stamp" />
              <span className="lp-entry__acct">
                <AccountCode code="110" />
                <span className="lp-entry__acct-name">CASH FLOW · #0142E7</span>
              </span>
              <h3 className="lp-entry__title">Friday payroll for 8 employees is at risk because $40k in receivables is 60 days overdue.</h3>
              <div className="lp-tiles">
                <div className="lp-tile lp-lift">
                  <div className="lp-tile__k">OWED TO YOU</div>
                  <div className="lp-tile__v">$40,000</div>
                  <div className="lp-tile__note">two clients, 60 days late</div>
                </div>
                <div className="lp-tile lp-lift">
                  <div className="lp-tile__k">ON HAND</div>
                  <div className="lp-tile__v">$11,000</div>
                  <div className="lp-tile__note">in the account</div>
                </div>
                <div className="lp-tile lp-lift">
                  <div className="lp-tile__k">DUE</div>
                  <div className="lp-tile__v lp-tile__v--display">Friday</div>
                  <div className="lp-tile__note">payroll, 8 employees</div>
                </div>
              </div>
              <div className="lp-rules2" aria-hidden="true">
                <span className="lp-rule lp-rv-line" />
                <span className="lp-rule lp-rv-line" />
              </div>
              <div className="lp-bl">
                <span className="lp-bl__label">THE BOTTOM LINE</span>
                <p className="lp-bl__text">
                  Today, call both clients and ask for payment by Thursday. In parallel, ask your bank about a short-term line of credit, and fund payroll
                  taxes first.
                </p>
              </div>
              <div className="lp-need">
                <span className="lp-need__label">WE STILL NEED TO KNOW</span>
                <Link to={start} className="lp-need__chip lp-lift">
                  Total payroll due Friday →
                </Link>
                <Link to={start} className="lp-need__chip lp-lift">
                  Existing line of credit? →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Chart of accounts (ledger book) ── */}
      <section id="accounts" className="lp-accounts">
        <div className="lp-section-head lp-rv">
          <div className="lp-accounts__head">
            <span className="lp-eyebrow">CHART OF ACCOUNTS</span>
            <h2 className="lp-h2">Every problem lands in one account.</h2>
          </div>
          <p className="lp-lede lp-accounts__p">
            If it doesn’t fit one yet, it goes to Suspense, the account bookkeepers use for entries they can’t place yet. Then we ask instead of guessing.
          </p>
        </div>
        <div className="lp-book lp-rv">
          {ACCOUNT_ORDER.map((c) => (
            <Link key={c} to={start} className="lp-acct">
              <span className={clsx('lp-acct__code', c === 'other' && 'lp-acct__code--suspense')}>{ACCOUNTS[c].code}</span>
              <span className="lp-acct__name">{ACCOUNTS[c].name}</span>
              <span className="lp-acct__holds">{ACCOUNTS[c].holds}</span>
              <span className="lp-arr" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Four rules ── */}
      <section id="rules" className="lp-rules">
        <div className="lp-rules__inner">
          <div className="lp-rules__head lp-rv">
            <span className="lp-eyebrow lp-rules__eyebrow">HOW WE KEEP THE BOOKS HONEST</span>
            <h2 className="lp-h2">Four rules we don’t bend.</h2>
          </div>
          <div className="lp-rules__grid">
            {RULES.map((r, i) => (
              <div key={r.n} className={clsx('lp-rulecard lp-rv lp-lift', i === 3 && 'lp-rulecard--dark')}>
                <span className="lp-rulecard__num">{r.n}</span>
                <h3 className="lp-rulecard__title">{r.title}</h3>
                <p className="lp-rulecard__text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="lp-ctaband on-hero">
        <svg className="lp-ctaband__waves" viewBox="0 0 1800 420" width="1800" height="420" aria-hidden="true">
          <g className="lp-a-wave" fill="none" strokeWidth="1.6">
            {WAVES_FRONT.map((y) => (
              <path key={y} d={wave(y, 60)} />
            ))}
          </g>
          <g className="lp-a-wave2" fill="none" strokeWidth="1.6">
            {WAVES_BACK.map((y) => (
              <path key={y} d={wave(y, 50)} />
            ))}
          </g>
        </svg>
        <div className="lp-ctaband__inner lp-rv">
          <h2 className="lp-ctaband__h2">What’s keeping you up at night?</h2>
          <p className="lp-ctaband__p">Write it down the way you’d say it out loud. It takes a couple of minutes.</p>
          <Link to={start} className={buttonClass('accent', 60, 'lp-ctaband__btn lp-a-glow')}>
            {authed ? 'Open your cases →' : 'Start a case →'}
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <Wordmark className="lp-footer__word on-hero-band" />
          <span className="lp-badge">
            <span className="lp-badge__avatar" aria-hidden="true">A</span>
            <span className="lp-badge__name">Made by Anjali</span>
            <span className="lp-badge__sep" aria-hidden="true" />
            <a className="lp-badge__mail" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
