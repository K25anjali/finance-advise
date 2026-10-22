import { Fragment, useMemo, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { factDelay, findFactSpans, linkKey, machineStamp, spanId, splitQuote, type FactKey } from '../../lib/ledger'
import type { AdvisoryResponse } from '../../lib/types'
import { Staple } from '../ui'
import { useLink } from './linking'

/** The owner's words, verbatim, on thermal paper with a torn edge (design.md §6.2). */
export function Receipt({
  content,
  attachment,
  createdAt,
  advisory,
  sweep = false,
  className,
}: {
  content: string
  attachment?: string | null
  createdAt: string
  /** The entry this receipt was filed into; its facts get highlighted here. */
  advisory?: AdvisoryResponse | null
  /** Sweep the highlighter in (only when the entry just arrived). */
  sweep?: boolean
  className?: string
}) {
  const { quote, body } = splitQuote(content)
  return (
    <div className={clsx('paper-shadow w-full max-w-[600px]', className)}>
      <div className="receipt torn-bottom px-4 pt-3 sm:px-5">
        <div className="t-machine flex flex-wrap justify-between gap-x-4 text-graphite">
          <span>RECEIVED {machineStamp(createdAt)}</span>
          {attachment && (
            <span className="inline-flex items-center gap-1.5 text-carbon">
              <Staple /> {attachment}
            </span>
          )}
        </div>
        {quote && <p className="t-machine mt-2 text-carbon">RE: {quote}</p>}
        <div className="mt-2 whitespace-pre-wrap text-ink">
          {advisory && advisory.model_used !== 'none' ? <Highlighted text={body} advisory={advisory} sweep={sweep} /> : body}
        </div>
      </div>
    </div>
  )
}

function Highlighted({ text, advisory, sweep }: { text: string; advisory: AdvisoryResponse; sweep: boolean }) {
  const { active, setActive } = useLink()
  const spans = useMemo(() => findFactSpans(text, advisory.extracted_fields), [text, advisory])
  const rid = advisory.request_id
  const placed = new Set<FactKey>()

  const out: ReactNode[] = []
  let at = 0
  spans.forEach((s, i) => {
    if (s.start > at) out.push(<Fragment key={`t${i}`}>{text.slice(at, s.start)}</Fragment>)
    const key = linkKey(rid, s.fact)
    const first = !placed.has(s.fact)
    placed.add(s.fact)
    out.push(
      <mark
        key={`m${i}`}
        id={first ? spanId(rid, s.fact) : undefined}
        className="hl"
        data-sweep={sweep || undefined}
        data-active={active === key || undefined}
        style={{ '--delay': `${factDelay(s.fact)}ms` } as CSSProperties}
        onMouseEnter={() => setActive(key)}
        onMouseLeave={() => setActive(null)}
      >
        {text.slice(s.start, s.end)}
      </mark>,
    )
    at = s.end
  })
  if (at < text.length) out.push(<Fragment key="end">{text.slice(at)}</Fragment>)
  return <>{out}</>
}

