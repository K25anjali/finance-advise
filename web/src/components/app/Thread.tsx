import { useEffect, useState } from 'react'
import { splitQuote } from '../../lib/ledger'
import type { CaseMessage } from '../../lib/types'
import { useAuth } from '../../store/useAuth'
import { useCases } from '../../store/useCases'
import { AccountsIcon } from '../icons'
import { Avatar, Button } from '../ui'
import { AssistantMessage } from './AssistantMessage'

export function Messages({ messages }: { messages: CaseMessage[] }) {
  const lastAssistant = messages.findLast((m) => m.role === 'assistant')?.id
  return (
    <>
      {messages.map((m, i) => {
        if (m.role === 'user') return <UserMessage key={m.id} message={m} />
        if (!m.advisory) return null
        const previous = messages.slice(0, i).findLast((p) => p.role === 'assistant' && p.advisory)?.advisory
        return <AssistantMessage key={m.id} advisory={m.advisory} previous={previous} latest={m.id === lastAssistant} />
      })}
    </>
  )
}

/** The owner's words, verbatim, right-aligned with their initials. */
export function UserMessage({ message }: { message: CaseMessage }) {
  const user = useAuth((s) => s.user)
  const name = user?.name || user?.email || 'You'
  const { quote, body } = splitQuote(message.content)
  return (
    <div className="dk-msg dk-user">
      <Avatar name={name} src={user?.avatar_url} size={28} />
      <div className="dk-user__body">
        {quote && (
          <p className="dk-user__re">
            <strong>RE</strong>
            {quote}
          </p>
        )}
        <p className="dk-user__text">{body}</p>
        {message.attachment_name && (
          <span className="dk-attach">
            <AccountsIcon size={13} />
            <span>{message.attachment_name}</span>
          </span>
        )}
      </div>
    </div>
  )
}

const STEPS = ['READING YOUR NOTE', 'SORTING INTO ACCOUNTS', 'PICKING OUT AMOUNTS & DATES', 'CHECKING DEADLINES', 'WRITING THE BOTTOM LINE']

/** Real steps print one line at a time while the entry is written. No spinners. */
export function Thinking() {
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
  const lines = slow ? [...STEPS.slice(0, n), 'STILL WORKING. THE FIRST REQUEST IN A WHILE TAKES LONGER.'] : STEPS.slice(0, n)
  return (
    <div className="dk-msg dk-thinking" data-anchor role="status" aria-live="polite">
      {lines.map((l, i) => (
        <div key={l} className={i === lines.length - 1 ? 'dk-thinking__line dk-thinking__line--now' : 'dk-thinking__line'}>
          <span className="dk-thinking__n">{String(i + 1).padStart(2, '0')}</span>
          <span>
            {l}
            {i === lines.length - 1 ? '…' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Our failure is not the owner's fault: a plain card, never red. */
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
      ? `We’re busy right now. Try again in ${retryAfter ?? 30} seconds. Your note is saved.`
      : status === 0
        ? "We can't reach Untangle. Check your connection, then try again. Your note is saved."
        : status >= 500
          ? 'Something went wrong on our side. Your note is saved, so you can send it again.'
          : message

  return (
    <div className="dk-msg dk-error" data-anchor role="alert">
      <h2 className="dk-label">NOT FILED YET</h2>
      <p>{copy}</p>
      <div className="dk-error__actions">
        {onRetry && (
          <Button variant="outline" size={38} onClick={onRetry} disabled={remaining > 0}>
            {remaining > 0 ? `Retry in ${remaining}s` : 'Send again'}
          </Button>
        )}
        <Button variant="ghost" size={38} onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
