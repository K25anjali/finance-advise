import { useState } from 'react'
import { accountLabel, ACCOUNTS } from '../../lib/meta'
import { entryRef, entryToText, factsOf, FACT_LABELS } from '../../lib/entry'
import type { AdvisoryResponse } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon, ThumbIcon } from '../icons'
import { IconButton, UrgencyStamp } from '../ui'

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']

/** What changed since the previous entry, in one line for the INKED row. */
function inkedNote(a: AdvisoryResponse, prev: AdvisoryResponse) {
  const had = new Set(factsOf(prev).map((f) => f.key))
  const added = factsOf(a).filter((f) => !had.has(f.key))
  if (added.length) {
    const names = added.map((f) => FACT_LABELS.find((l) => l.key === f.key)!.label.toLowerCase())
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
    return `${list[0].toUpperCase()}${list.slice(1)} added to the entry`
  }
  if (prev.low_confidence_flag && !a.low_confidence_flag) return 'No longer pencilled in'
  if (prev.category !== a.category) return `Moved to ${accountLabel(a.category)}`
  return 'Entry updated with your answer'
}

/**
 * The desk's reply: no bubble, serif prose. Meta row, the issue, what was picked out, the bottom line,
 * the working on demand, questions to answer, and a small toolbar.
 */
export function AssistantMessage({
  advisory: a,
  previous,
  latest,
}: {
  advisory: AdvisoryResponse
  /** The case's previous entry: when there is one, this reply is an update ("INKED"). */
  previous?: AdvisoryResponse | null
  /** Newest entry in the case: its questions can be answered. */
  latest: boolean
}) {
  const insert = useCases((s) => s.insertIntoComposer)
  const [working, setWorking] = useState(false)

  if (a.model_used === 'none') return <DeskUnavailable advisory={a} />

  const facts = factsOf(a)
  // An update to an earlier entry is "inked" rather than filed afresh.
  const prev = previous && previous.model_used !== 'none' ? previous : null
  const questions = a.follow_up_questions

  return (
    <article className="dk-msg dk-reply" data-anchor aria-label={`Entry filed to ${ACCOUNTS[a.category].name}`}>
      <div className="dk-reply__meta">
        {prev ? (
          <>
            <span className="dk-inked">
              <CheckIcon size={12} strokeWidth={3} />
              INKED
            </span>
            {prev.urgency !== a.urgency && <UrgencyStamp urgency={a.urgency} />}
            <span className="dk-reply__filed">{inkedNote(a, prev)}</span>
          </>
        ) : (
          <>
            <UrgencyStamp urgency={a.urgency} />
            <span className="dk-reply__filed">
              Filed to <strong>{accountLabel(a.category)}</strong> · entry #{entryRef(a)}
            </span>
          </>
        )}
      </div>

      <p>{a.extracted_fields.primary_issue}</p>
      {a.low_confidence_flag && (
        <p className="dk-reply__pencil">This entry is pencilled in: we’re not sure of it yet. Answer the questions below and we’ll firm it up.</p>
      )}

      {(facts.length > 0 || a.missing_information.length > 0) && (
        <>
          <div className="dk-reply__heading">What we picked out</div>
          <ul>
            {facts.map((f) => (
              <li key={f.key}>
                <strong>{f.label}:</strong> {f.value}
              </li>
            ))}
            {a.missing_information.map((m) => (
              <li key={m}>
                <span className="dk-pencilled">still needed</span> {m}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="dk-bottom-line">
        <div className="dk-label">THE BOTTOM LINE</div>
        <p>{a.recommended_action}</p>
      </div>

      <div className="dk-working">
        <button type="button" className="dk-working__toggle" aria-expanded={working} onClick={() => setWorking((v) => !v)}>
          <ChevronDownIcon size={14} />
          {working ? 'Hide the working' : 'Show the working'}
        </button>
        {working && (
          <div className="dk-working__body">
            <p>{a.rationale}</p>
            <dl className="dk-figures">
              <dt>Confidence</dt>
              <dd>{Math.round(a.confidence * 100)}%</dd>
              <dt>Sufficiency</dt>
              <dd>{a.has_sufficient_info ? 'Enough to advise' : 'Needs more'}</dd>
              <dt>Time</dt>
              <dd>{(a.processing_time_ms / 1000).toFixed(1)}s</dd>
            </dl>
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <>
          <div className="dk-reply__heading">
            {COUNT[questions.length] ?? questions.length} question{questions.length === 1 ? '' : 's'} so we can be specific
          </div>
          <ol>
            {questions.map((q) => (
              <li key={q}>
                {latest ? (
                  <button type="button" className="dk-question" onClick={() => insert(q)}>
                    {q}
                    <span className="dk-question__hint">Answer →</span>
                  </button>
                ) : (
                  q
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      <Toolbar advisory={a} />
    </article>
  )
}

function Toolbar({ advisory: a }: { advisory: AdvisoryResponse }) {
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entryToText(a))
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard unavailable (insecure context)
    }
  }

  const exportEntry = () => {
    const url = URL.createObjectURL(new Blob([entryToText(a)], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `untangle-entry-${entryRef(a)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dk-toolbar">
      <IconButton label={copied ? 'Copied' : 'Copy entry'} onClick={copy}>
        {copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
      </IconButton>
      <IconButton label="Helpful" aria-pressed={vote === 'up'} onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}>
        <ThumbIcon size={17} />
      </IconButton>
      <IconButton label="Not helpful" aria-pressed={vote === 'down'} onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}>
        <ThumbIcon size={17} style={{ transform: 'rotate(180deg)' }} />
      </IconButton>
      <IconButton label="Export entry" onClick={exportEntry}>
        <DownloadIcon size={17} />
      </IconButton>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Entry copied' : ''}
      </span>
      <span className="dk-toolbar__note">Not professional financial advice</span>
    </div>
  )
}

/** The fallback when the model couldn't be reached: our failure, so plain and calm, no stamp. */
function DeskUnavailable({ advisory: a }: { advisory: AdvisoryResponse }) {
  return (
    <article className="dk-msg dk-reply" data-anchor>
      <div className="dk-reply__meta">
        <span className="dk-inked">NOT FILED YET</span>
        <span className="dk-reply__filed">We couldn’t sort this one yet</span>
      </div>
      <p>{a.recommended_action}</p>
      <p className="dk-reply__pencil">{a.rationale}</p>
    </article>
  )
}
