import { Link } from 'react-router'
import { ACCOUNTS, ACCOUNT_ORDER, BRAND } from '../lib/meta'
import { useAuth } from '../store/useAuth'
import { HeroComposer } from '../components/landing/HeroComposer'
import { Guilloche } from '../components/landing/Guilloche'
import { Specimen } from '../components/landing/Specimen'
import { Logo, ThemeToggle } from '../components/ui'

const PROMISES = [
  {
    term: 'Pencil until it’s ink',
    body: 'When we aren’t sure, the entry is pencilled in and says so. Answer the queries in the margin and it gets inked.',
  },
  {
    term: 'Your words, kept',
    body: 'Your note stays on file exactly as you wrote it, with every amount and date we picked out highlighted where you said it.',
  },
  {
    term: 'Fails soft',
    body: 'If the desk can’t answer safely, you get a plain note and where to find free human help. You never get a guess.',
  },
  {
    term: 'Private drawer',
    body: 'Cases belong to your account alone. Take any of them out of the drawer, for good, whenever you like.',
  },
]

export default function LandingPage() {
  const authed = useAuth((s) => s.status) === 'authed'
  const start = authed ? '/app' : '/signup'

  return (
    <div className="min-h-dvh overflow-x-clip">
      <nav className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-2 px-4">
          <Link to="/" aria-label={`${BRAND} home`} className="mr-auto">
            <Logo />
          </Link>
          <a href="#specimen" className="btn btn-quiet hidden md:inline-flex">
            Specimen
          </a>
          <a href="#accounts" className="btn btn-quiet hidden md:inline-flex">
            Accounts
          </a>
          <ThemeToggle />
          {!authed && (
            <Link to="/login" className="btn btn-quiet max-sm:hidden">
              Sign in
            </Link>
          )}
          <Link to={start} className="btn btn-ink !h-9">
            {authed ? 'Open the drawer' : 'Start a case'}
          </Link>
        </div>
      </nav>

      {/* ── Hero: the intake slip, front and centre ── */}
      <header className="relative">
        <Guilloche className="pointer-events-none absolute -top-40 -right-56 size-[720px] opacity-40 max-md:hidden" />
        <div className="relative mx-auto grid max-w-[1120px] gap-10 px-4 pt-14 pb-20 sm:pt-20 lg:grid-cols-[5fr_6fr] lg:gap-16 lg:pt-28">
          <div>
            <p className="t-label">Financial triage for small businesses</p>
            <h1 className="t-display mt-4 text-[40px] leading-[44px] sm:text-[52px] sm:leading-[56px]">
              Bring the shoebox.
              <br />
              Leave with the bottom line.
            </h1>
            <p className="mt-6 max-w-[46ch] text-graphite">
              Describe the money problem the way it is: tangled, half-remembered, in a hurry. {BRAND} posts it to the right account,
              ticks off the facts, stamps how soon it needs you, and writes one next step underneath.
            </p>
          </div>
          <div className="lg:pt-6">
            <HeroComposer />
          </div>
        </div>
      </header>

      {/* ── One real case ── */}
      <section id="specimen" className="scroll-mt-8 border-t border-rule-strong">
        <div className="mx-auto max-w-[992px] px-4 pt-16 pb-24">
          <p className="t-label">Specimen · one case, start to finish</p>
          <h2 className="t-h1 mt-2 max-w-[24ch] sm:text-[32px] sm:leading-[40px]">Your words go in as they are. A ledger entry comes out.</h2>
          <p className="mt-3 max-w-[60ch] text-graphite">
            Hover a fact in the entry to see where you said it. The stamp says when to act. The line under the double rule is the
            thing to do first.
          </p>
          <div className="mt-10">
            <Specimen />
          </div>
        </div>
      </section>

      {/* ── Chart of accounts ── */}
      <section id="accounts" className="scroll-mt-8 border-t border-rule-strong">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 pt-16 pb-24 lg:grid-cols-[4fr_7fr] lg:gap-16">
          <div>
            <p className="t-label">Chart of accounts</p>
            <h2 className="t-h1 mt-2">Every mess posts to one account.</h2>
            <p className="mt-3 max-w-[44ch] text-graphite">
              If it doesn’t fit any of them yet, it goes to Suspense, the account bookkeepers use for entries they can’t place. Then we
              ask, instead of guessing.
            </p>
          </div>
          <table className="w-full border-collapse self-start">
            <thead>
              <tr className="border-b border-rule-strong">
                <th className="t-label w-16 pb-1 text-left">Code</th>
                <th className="t-label pb-1 text-left">Account</th>
                <th className="t-label hidden pb-1 text-left sm:table-cell">Posted here</th>
              </tr>
            </thead>
            <tbody>
              {ACCOUNT_ORDER.map((c) => (
                <tr key={c} className="border-b border-rule align-top">
                  <td className="t-machine figures py-2.5 text-carbon">{ACCOUNTS[c].code}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{ACCOUNTS[c].name}</span>
                    <span className="t-sm mt-0.5 block text-graphite sm:hidden">{ACCOUNTS[c].holds}</span>
                  </td>
                  <td className="t-sm hidden py-2.5 text-graphite sm:table-cell">{ACCOUNTS[c].holds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── How we keep the books honest ── */}
      <section className="border-t border-rule-strong">
        <div className="mx-auto max-w-[1120px] px-4 pt-16 pb-24">
          <p className="t-label">How we keep the books honest</p>
          <dl className="mt-6 border-t border-rule">
            {PROMISES.map((p) => (
              <div key={p.term} className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[4fr_7fr] sm:gap-16">
                <dt className="t-h2">{p.term}</dt>
                <dd className="max-w-[60ch] text-graphite">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="border-t border-rule-strong">
        <div className="mx-auto max-w-[1120px] px-4 pt-20 pb-24">
          <h2 className="t-display text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px]">What’s keeping you up at night?</h2>
          <p className="mt-3 text-graphite">Write it down. It takes about as long as typing it out.</p>
          <Link to={start} className="btn btn-primary mt-8">
            {authed ? 'Open the drawer' : 'Start your first case'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-rule-strong">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="t-fine max-w-[60ch] sm:text-right">
            AI-generated triage, not professional financial, tax or legal advice. Consult a qualified advisor for decisions affecting
            your business.
          </p>
        </div>
      </footer>
    </div>
  )
}
