import { useEffect, useState } from 'react'
import type { CaseMessage } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { LedgerEntry } from './LedgerEntry'
import { Receipt } from './Receipt'

/** Receipts and entries share one grid so receipts line up with the worksheet column, never the margin. */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_240px] wide:gap-8">{children}</div>
}

/** An entry that arrived in the last few seconds plays its write-in; older ones are already on the page. */
const isFresh = (m: CaseMessage) => Date.now() - new Date(m.created_at).getTime() < 15_000

export function Messages({ messages }: { messages: CaseMessage[] }) {
  const lastAssistant = messages.findLast((m) => m.role === 'assistant')?.id
  return (
    <>
      {messages.map((m, i) => {
        if (m.role === 'user') {
          // The entry this receipt was filed into is the next assistant message.
          const next = messages[i + 1]
          const advisory = next?.role === 'assistant' ? next.advisory : null
          return (
            <Row key={m.id}>
              <Receipt
                content={m.content}
                attachment={m.attachment_name}
                createdAt={m.created_at}
                advisory={advisory}
                sweep={!!next && isFresh(next)}
              />
            </Row>
          )
        }
        if (!m.advisory) return null
        const prev = messages.slice(0, i).findLast((p) => p.role === 'assistant')?.advisory
        return (
          <LedgerEntry
            key={m.id}
            advisory={m.advisory}
            latest={m.id === lastAssistant}
            fresh={m.id === lastAssistant && isFresh(m)}
            inkOver={!!prev?.low_confidence_flag && !m.advisory.low_confidence_flag}
          />
        )
      })}
    </>
  )
}

export function PendingReceipt({ message }: { message: CaseMessage }) {
  return (
    <Row>
      <div className="feed">
        <Receipt content={message.content} attachment={message.attachment_name} createdAt={message.created_at} />
      </div>
    </Row>
  )
}

const STEPS = ['READING YOUR NOTE', 'SORTING INTO ACCOUNTS', 'PICKING OUT AMOUNTS & DATES', 'CHECKING DEADLINES', 'WRITING THE BOTTOM LINE']

/** Adding-machine tape: real steps print one line at a time. No spinners (design.md §6.10). */
export function Tape() {
  const [n, setN] = useState(1)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const step = setInterval(() => setN((v) => Math.min(STEPS.length, v + 1)), 1300)
    const cold = setTimeout(() => setSlow(true), 8000)
    return () => {
      clearInterval(step)
      clearTimeout(cold)
    }
  }, [])
  const lines = slow ? [...STEPS.slice(0, n), 'STILL WORKING. THE FIRST REQUEST AFTER A QUIET SPELL IS SLOW.'] : STEPS.slice(0, n)
  return (
    <Row>
      <div className="paper-shadow ml-4 w-[min(320px,80%)] sm:ml-8" data-anchor>
        <div className="receipt torn-bottom px-4 pt-3" role="status" aria-live="polite">
          {lines.map((l, i) => (
            <div key={l} className="t-machine feed flex gap-3 text-graphite">
              <span className="figures text-pencil">{String(i + 1).padStart(2, '0')}</span>
              <span className={i === lines.length - 1 ? 'text-ink' : undefined}>
                {l}
                {i === lines.length - 1 ? '…' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Row>
  )
}

/** Our failure is not the owner's fault: plain sheet, never red, never stamped (design.md §6.12). */
export function ErrorSheet({ onRetry }: { onRetry?: () => void }) {
  const error = useCases((s) => s.error)
  const dismiss = useCases((s) => s.dismissError)
  if (!error) return null
  return <ErrorBody key={error.at} status={error.status} message={error.message} retryAfter={error.retryAfter} onRetry={onRetry} onDismiss={dismiss} />
}

function ErrorBody({ status, message, retryAfter, onRetry, onDismiss }: {
  status: number
  message: string
  retryAfter?: number
  onRetry?: () => void
  onDismiss: () => void
}) {
  const [remaining, setRemaining] = useState(retryAfter ?? 0)
  useEffect(() => {
    if (!retryAfter) return
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [retryAfter])

  const copy =
    status === 429
      ? `Our desk is backed up. Try again in ${retryAfter ?? 30} seconds. Your note is kept.`
      : status === 0
        ? "We can't reach the desk. Check your connection, then retry. Your note is kept."
        : status >= 500
          ? 'Something went wrong on our side. Your note is kept, so you can send it again.'
          : message

  return (
    <Row>
      <div className="sheet px-4 py-4 sm:px-6" data-anchor role="alert">
        <h2 className="t-label">Not filed yet</h2>
        <p className="mt-1 text-ink">{copy}</p>
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <button onClick={onRetry} disabled={remaining > 0} className="btn btn-ink !h-9">
              <span className="figures">{remaining > 0 ? `Retry in ${remaining}s` : 'Send again'}</span>
            </button>
          )}
          <button onClick={onDismiss} className="btn btn-quiet !h-9">
            Dismiss
          </button>
        </div>
      </div>
    </Row>
  )
}
