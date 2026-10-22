import { useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { ACCOUNTS, accountLabel } from '../../lib/meta'
import { FACT_ROWS, linkKey, rowDelay, spanId, type FactKey } from '../../lib/ledger'
import type { AdvisoryResponse } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { Tick } from '../ui'
import { Stamp } from './Stamp'
import { useLink } from './linking'

const MONEY = /\$\s?\d[\d,]*(?:\.\d+)?\s?(?:k|K|m|M)?\b/g

type Row = { key: FactKey | 'prior_actions'; label: string; value: string; amount?: string }

function rowsOf(a: AdvisoryResponse): Row[] {
  const f = a.extracted_fields
  const values: Record<Row['key'], string | null> = {
    financial_amount: f.financial_amount,
    deadline: f.deadline,
    entities_involved: f.entities_involved.length ? f.entities_involved.join(', ') : null,
    prior_actions: f.prior_actions,
  }
  // A missing fact is left off, not shown as "N/A" (design.md §6.5).
  return FACT_ROWS.filter((r) => values[r.key]).map((r) => ({
    ...r,
    value: values[r.key]!,
    amount: r.key === 'financial_amount' ? values[r.key]!.match(MONEY)?.join(' / ') : undefined,
  }))
}

function toPlainText(a: AdvisoryResponse) {
  const lines = [
    `${accountLabel(a.category)}  [${a.urgency.toUpperCase()}]`,
    a.extracted_fields.primary_issue,
    '',
    ...rowsOf(a).map((r) => `${r.label.padEnd(12)} ${r.value}`),
    '',
    `Working: ${a.rationale}`,
    '',
    '═'.repeat(40),
    `Bottom line: ${a.recommended_action}`,
  ]
  if (a.missing_information.length) lines.push('', 'Queries:', ...a.missing_information.map((m) => `  · ${m}`))
  if (a.follow_up_questions.length) lines.push('', 'Questions for you:', ...a.follow_up_questions.map((q, i) => `  ${i + 1}. ${q}`))
  return lines.join('\n')
}

/**
 * The system's answer as a ledger entry (design.md §6.3): account and stamp, the primary issue, ticked facts,
 * working notes, then the bottom line under a double rule. Queries and questions go in the margin.
 */
export function LedgerEntry({
  advisory: a,
  latest,
  fresh,
  inkOver = false,
}: {
  advisory: AdvisoryResponse
  /** Newest entry in the case: its questions can be answered. */
  latest: boolean
  /** Just arrived: play the write-in choreography. */
  fresh: boolean
  /** The previous entry was pencilled and this one is confident: ink over. */
  inkOver?: boolean
}) {
  if (a.model_used === 'none') return <DeskUnavailable advisory={a} />

  const rows = rowsOf(a)
  const pencil = a.low_confidence_flag
  const stampAt = rowDelay(rows.length) + 80
  const ruleAt = stampAt + 120
  // Write-in choreography (design.md §8): merges into the element's own classes.
  const anim = (className: string, delay: number) =>
    fresh ? { className: clsx(className, 'write-in'), style: { '--delay': `${delay}ms` } as CSSProperties } : { className }

  return (
    <article
      className="entry wide:grid wide:grid-cols-[minmax(0,1fr)_240px] wide:gap-8"
      data-pencil={pencil || undefined}
      data-ink-over={(fresh && inkOver) || undefined}
      data-anchor
      aria-label={`Entry: ${ACCOUNTS[a.category].name}`}
    >
      <div className={clsx('sheet relative', fresh && 'write-in')}>
        <div className="sm:grid sm:grid-cols-[72px_minmax(0,1fr)]">
          {/* Ref column, behind the red double margin rule */}
          <div className="hidden pt-4 pr-3 pl-3 sm:block">
            <div className="t-machine text-carbon">{a.request_id.replace(/-/g, '').slice(0, 6).toUpperCase()}</div>
          </div>

          <div className="relative min-w-0 px-4 pt-4 pb-5 sm:margin-rule sm:px-6">
            <header className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="t-label">{accountLabel(a.category)}</div>
                <div className="t-machine mt-0.5 text-carbon sm:hidden">{a.request_id.replace(/-/g, '').slice(0, 6).toUpperCase()}</div>
              </div>
              <Stamp urgency={a.urgency} seed={a.request_id} press={fresh} delay={stampAt} className="mt-0.5 shrink-0" />
            </header>

            <h2 {...anim('ink mt-4 font-voice text-[22px] leading-[28px] text-(--entry-ink) sm:text-[28px] sm:leading-[32px]', 60)}>
              {a.extracted_fields.primary_issue}
            </h2>

            {pencil && (
              <p className="t-sm mt-2 text-graphite italic">Pencilled in: we're not sure yet. Answer the queries and we'll ink it.</p>
            )}

            {rows.length > 0 && <Facts rows={rows} requestId={a.request_id} pencil={pencil} fresh={fresh} />}

            <section {...anim('mt-6', rowDelay(rows.length))}>
              <h3 className="t-label">Working</h3>
              <p className="ruled mt-1 text-graphite">{a.rationale}</p>
              <Figures a={a} />
            </section>

            {/* Marginalia sit inline below the wide breakpoint */}
            <div className="wide:hidden">
              <Marginalia a={a} latest={latest} inline />
            </div>

            <div className={clsx('double-rule mt-6', fresh && 'draw-rule')} style={{ '--delay': `${ruleAt}ms` } as CSSProperties} />
            <section {...anim('mt-3', ruleAt + 120)}>
              <h3 className="t-label">The bottom line</h3>
              <p className="ink mt-1 font-voice text-[20px] leading-[28px] text-(--entry-ink)">{a.recommended_action}</p>
            </section>

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-rule pt-2">
              <p className="t-fine max-w-[52ch]">{a.disclaimer}</p>
              <CopyButton text={() => toPlainText(a)} />
            </footer>
          </div>
        </div>
      </div>

      <aside className="hidden wide:block" aria-label="Margin notes">
        <Marginalia a={a} latest={latest} />
      </aside>
    </article>
  )
}

function Facts({ rows, requestId, pencil, fresh }: { rows: Row[]; requestId: string; pencil: boolean; fresh: boolean }) {
  const { active, setActive } = useLink()
  return (
    <table className="mt-5 w-full border-collapse text-[15px] leading-[20px]">
      <thead>
        <tr className="border-b border-rule-strong">
          <th className="t-label w-[96px] pb-1 text-left font-semibold">Fact</th>
          <th className="t-label pb-1 text-left font-semibold">As we read it</th>
          <th className="t-label hidden w-[96px] pb-1 text-right font-semibold sm:table-cell">$</th>
          <th className="w-6 pb-1">
            <span className="sr-only">{pencil ? 'To be confirmed' : 'Checked'}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const linkable = r.key !== 'prior_actions'
          const key = linkable ? linkKey(requestId, r.key as FactKey) : null
          const on = key !== null && active === key
          return (
            <tr
              key={r.key}
              className={clsx('border-b border-rule align-top transition-colors', fresh && 'write-in', on && 'bg-hl/50')}
              style={{ '--delay': `${rowDelay(i)}ms` } as CSSProperties}
              onMouseEnter={() => key && setActive(key)}
              onMouseLeave={() => key && setActive(null)}
            >
              <td className="t-label py-[10px] pr-3">{r.label}</td>
              <td className="py-2 pr-3">
                {linkable ? (
                  <button
                    type="button"
                    className="ink text-left text-(--entry-ink) decoration-rule-strong underline-offset-4 hover:underline"
                    onFocus={() => setActive(key)}
                    onBlur={() => setActive(null)}
                    onClick={() => {
                      const el = document.getElementById(spanId(requestId, r.key as FactKey))
                      if (!el) return
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      setActive(key)
                    }}
                    title="Show where you said this"
                  >
                    {r.value}
                  </button>
                ) : (
                  <span className="ink text-(--entry-ink)">{r.value}</span>
                )}
              </td>
              <td className="figures hidden py-2 pr-2 text-right whitespace-nowrap text-(--entry-ink) sm:table-cell">{r.amount}</td>
              <td className="py-2 text-right">
                <Tick open={pencil} className="inline size-4" />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** The raw numbers, on demand: never a headline (design.md §6.7). */
function Figures({ a }: { a: AdvisoryResponse }) {
  return (
    <details className="group mt-2">
      <summary className="t-label inline-flex cursor-pointer list-none items-center gap-1 text-carbon [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90">›</span> Figures
      </summary>
      <dl className="figures mt-1 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-0.5">
        <dt className="t-label">Confidence</dt>
        <dd className="t-machine text-graphite">{Math.round(a.confidence * 100)}%</dd>
        <dt className="t-label">Sufficiency</dt>
        <dd className="t-machine text-graphite">{a.has_sufficient_info ? 'ENOUGH TO ADVISE' : 'NEEDS MORE'}</dd>
        <dt className="t-label">Time</dt>
        <dd className="t-machine text-graphite">{(a.processing_time_ms / 1000).toFixed(1)}s</dd>
      </dl>
    </details>
  )
}

/** Queries and questions, written in the margin (design.md §6.8). */
function Marginalia({ a, latest, inline = false }: { a: AdvisoryResponse; latest: boolean; inline?: boolean }) {
  const insert = useCases((s) => s.insertIntoComposer)
  if (!a.missing_information.length && !a.follow_up_questions.length) return null
  return (
    <div className={clsx('t-sm', inline ? 'mt-6 border-l-2 border-carbon pl-4' : 'border-l border-carbon/40 pt-4 pl-4')}>
      {a.missing_information.length > 0 && (
        <Note title={a.has_sufficient_info ? 'Worth having to hand' : 'Queries before we can advise'}>
          <ul className="space-y-1.5">
            {a.missing_information.map((m) => (
              <li key={m} className="flex gap-2 text-ink">
                <span className="text-carbon" aria-hidden>
                  ·
                </span>
                {m}
              </li>
            ))}
          </ul>
        </Note>
      )}
      {a.follow_up_questions.length > 0 && (
        <Note title="Questions for you" className={a.missing_information.length ? 'mt-5' : ''}>
          <ol className="space-y-1">
            {a.follow_up_questions.map((q, i) => (
              <li key={q}>
                {latest ? (
                  <button
                    type="button"
                    onClick={() => insert(q)}
                    className="group/q -mx-1.5 flex w-[calc(100%+12px)] gap-2 rounded-[2px] px-1.5 py-1 text-left text-ink hover:bg-carbon/8"
                  >
                    <span className="figures t-machine text-carbon">{i + 1}.</span>
                    <span>
                      {q} <span className="t-label whitespace-nowrap text-carbon group-hover/q:underline">Answer →</span>
                    </span>
                  </button>
                ) : (
                  <div className="flex gap-2 py-1 text-graphite">
                    <span className="figures t-machine">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Note>
      )}
    </div>
  )
}

function Note({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <h3 className="t-label mb-2 !text-carbon">{title}</h3>
      {children}
    </section>
  )
}

function CopyButton({ text }: { text: () => string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-quiet t-label -mr-2 !h-7"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text())
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        } catch {
          // clipboard unavailable (insecure context)
        }
      }}
    >
      {copied ? 'Copied' : 'Copy entry'}
    </button>
  )
}

/** The fallback when the model couldn't be reached: our failure, so plain and calm, no stamp (design.md §6.12). */
function DeskUnavailable({ advisory: a }: { advisory: AdvisoryResponse }) {
  return (
    <article className="sheet px-4 py-4 sm:px-6" data-anchor>
      <h2 className="t-label">The desk couldn't read this yet</h2>
      <p className="mt-2 text-ink">{a.recommended_action}</p>
      <p className="t-sm mt-2 text-graphite">{a.rationale}</p>
    </article>
  )
}
