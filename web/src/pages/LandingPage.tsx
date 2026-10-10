import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  ArrowRight,
  FileSearch,
  FileText,
  Gauge,
  History,
  LifeBuoy,
  ListChecks,
  Lock,
  MessagesSquare,
  Route,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { CATEGORY_META, CATEGORY_ORDER } from '../lib/meta'
import { useAuth } from '../store/useAuth'
import { DemoCard } from '../components/landing/DemoCard'
import { Logo, ThemeToggle } from '../components/ui'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export default function LandingPage() {
  const status = useAuth((s) => s.status)
  const authed = status === 'authed'

  return (
    <div className="relative overflow-x-clip">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            'radial-gradient(40% 50% at 75% 15%, color-mix(in srgb, var(--accent) 14%, transparent), transparent), radial-gradient(35% 40% at 15% 35%, #F2735A14, transparent)',
        }}
      />

      <nav className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-ink-2 md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#trust" className="hover:text-ink">Safety</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {authed ? (
              <Link to="/app" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-bg">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-xl px-3.5 py-2 text-sm text-ink-2 hover:text-ink sm:block">
                  Sign in
                </Link>
                <Link to="/signup" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-bg">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-24 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div>
          <motion.div {...fade()} className="chip !cursor-default !text-[12px]">
            <Sparkles className="size-3.5 text-accent" /> AI triage for small-business money problems
          </motion.div>
          <motion.h1
            {...fade(0.05)}
            className="mt-6 font-display text-[52px] leading-[0.98] tracking-tight text-balance sm:text-[76px]"
          >
            Your business finances, <em className="text-ink-3">untangled in one conversation.</em>
          </motion.h1>
          <motion.p {...fade(0.1)} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Describe the mess in plain words: back taxes, late invoices, a loan you can't figure out. Ledgerline
            routes it to the right desk, pulls out the facts, judges the urgency and tells you exactly what to do
            next.
          </motion.p>
          <motion.div {...fade(0.15)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={authed ? '/app' : '/signup'}
              className="group inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-accent-ink shadow-lg shadow-[var(--glow)] transition-all hover:brightness-110"
            >
              {authed ? 'Open your cases' : 'Start a free case'}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how" className="rounded-2xl border border-line px-5 py-3.5 text-[15px] text-ink-2 hover:border-line-strong hover:text-ink">
              See how it works
            </a>
          </motion.div>
          <motion.div {...fade(0.2)} className="mt-8 flex items-center gap-5 text-xs text-ink-3">
            <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> History private to your account</span>
            <span className="flex items-center gap-1.5"><MessagesSquare className="size-3.5" /> ~5s per answer</span>
          </motion.div>
        </div>

        <motion.div {...fade(0.15)} className="relative">
          <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-accent/10 via-transparent to-transparent blur-2xl" />
          <div className="panel relative p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="mb-5 flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#F0524F]/70" />
              <span className="size-2.5 rounded-full bg-[#D9B13B]/70" />
              <span className="size-2.5 rounded-full bg-[#3FB57F]/70" />
              <span className="ml-3 font-mono text-[11px] text-ink-3">ledgerline / payroll-crunch</span>
            </div>
            <DemoCard />
          </div>
        </motion.div>
      </section>

      {/* Desks marquee */}
      <section className="border-y border-line bg-panel/50 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5">
          <span className="label">Seven specialist desks</span>
          {CATEGORY_ORDER.filter((c) => c !== 'unclear').map((c) => {
            const m = CATEGORY_META[c]
            const Icon = m.icon
            return (
              <span key={c} className="flex items-center gap-2 text-sm text-ink-2">
                <Icon className="size-4" style={{ color: m.color }} /> {m.label}
              </span>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-28">
        <motion.div {...fade()} className="max-w-2xl">
          <div className="label">How it works</div>
          <h2 className="mt-3 font-display text-[44px] leading-[1.05] tracking-tight">From “it's a mess” to a plan, in three moves.</h2>
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ['01', 'Describe it, messily', 'No forms, no jargon. Type it like you would to a friend, and attach a notice or statement if you have one.'],
            ['02', 'Get routed and assessed', 'One structured AI pass picks the right desk, pulls out amounts, deadlines and who is involved, and rates the urgency.'],
            ['03', 'Answer, and it sharpens', 'Every answer comes with follow-up questions. Reply in the same thread and the advice updates with full context.'],
          ].map(([n, t, d], i) => (
            <motion.div key={n} {...fade(i * 0.08)} className="panel relative overflow-hidden p-7">
              <div className="font-mono text-[13px] text-accent">{n}</div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{d}</p>
              <div className="absolute -right-6 -bottom-10 font-display text-[140px] leading-none text-ink/[0.04]">{n}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-5 py-28">
          <motion.div {...fade()} className="max-w-2xl">
            <div className="label">What you get back</div>
            <h2 className="mt-3 font-display text-[44px] leading-[1.05] tracking-tight">Everything a good advisor would ask first.</h2>
          </motion.div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<Route />} title="Routed, not guessed" i={0}>
              Each case goes to one of seven desks. When it's genuinely unclear, we say so and ask instead of guessing.
            </Feature>
            <Feature icon={<FileSearch />} title="Facts, extracted" i={1}>
              Dollar amounts, deadlines, agencies, what you've tried. Pulled out exactly as you said them, never invented.
            </Feature>
            <Feature icon={<Gauge />} title="Honest confidence" i={2}>
              A calibrated confidence score with visible thresholds, so you can tell a sure call from a tentative one.
            </Feature>
            <Feature icon={<ListChecks />} title="A concrete next step" i={3}>
              Not “consult a professional”, but who to call, what to ask for and what to gather before you do.
            </Feature>
            <Feature icon={<FileText />} title="Bring the paperwork" i={4}>
              Attach the IRS notice or bank statement as a PDF or TXT, and it's read alongside your description.
            </Feature>
            <Feature icon={<History />} title="Every case, saved" i={5}>
              Sign in with Google, GitHub or email. Your threads are kept privately and are there when you come back.
            </Feature>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <motion.div {...fade()}>
            <div className="label">Built to fail soft</div>
            <h2 className="mt-3 font-display text-[44px] leading-[1.05] tracking-tight">It knows when not to be sure.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
              Money problems deserve a careful tool. The model's answer is locked to a strict schema and checked, and if
              anything goes wrong you get a safe, honest response instead of a confident wrong one.
            </p>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [<ShieldAlert key="a" />, 'Prompt-injection aware', 'What you type is treated as data to analyse, never as instructions.'],
              [<Gauge key="b" />, 'Low confidence is flagged', 'Below 70% you see a warning; below 40% it routes to “needs clarification”.'],
              [<LifeBuoy key="c" />, 'Graceful when the AI is down', 'Retries, a backup model, then a clear fallback pointing to free human help.'],
              [<Lock key="d" />, 'Private by default', 'Cases belong to your account alone. Delete any of them at any time.'],
            ].map(([icon, t, d], i) => (
              <motion.div key={String(t)} {...fade(i * 0.06)} className="panel p-5">
                <div className="text-accent [&_svg]:size-5">{icon}</div>
                <div className="mt-3 font-medium">{t}</div>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <motion.div
          {...fade()}
          className="relative overflow-hidden rounded-[28px] border border-line bg-ink px-8 py-16 text-center text-bg sm:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: 'radial-gradient(50% 80% at 50% 0%, color-mix(in srgb, var(--accent) 35%, transparent), transparent)' }}
          />
          <h2 className="relative font-display text-[44px] leading-[1.05] tracking-tight sm:text-[56px]">
            What's the money problem keeping you up?
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-[15px] opacity-70">
            Open a case in under a minute, and keep every thread in one place.
          </p>
          <Link
            to={authed ? '/app' : '/signup'}
            className="group relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-[15px] font-semibold text-accent-ink transition-all hover:brightness-110"
          >
            {authed ? 'Open your cases' : 'Create your account'}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo sub={false} />
          <p className="max-w-xl">
            Ledgerline provides AI-generated triage, not professional financial, tax or legal advice. Consult a qualified
            advisor for decisions affecting your business.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, children, i }: { icon: ReactNode; title: string; children: ReactNode; i: number }) {
  return (
    <motion.div {...fade(i * 0.05)} className="group panel p-6 transition-colors hover:border-line-strong">
      <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-105 [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{children}</p>
    </motion.div>
  )
}
