import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Check, FileText, RotateCcw, X } from 'lucide-react'
import clsx from 'clsx'
import type { CaseMessage } from '../../lib/types'
import { useAuth } from '../../store/useAuth'
import { useCases } from '../../store/useCases'
import { Avatar, LogoMark } from '../ui'
import { AdvisoryCard } from './AdvisoryCard'

export function UserBubble({ message }: { message: CaseMessage }) {
  const user = useAuth((s) => s.user)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end gap-3"
    >
      <div className="flex max-w-[85%] flex-col items-end gap-1.5">
        <div className="rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-bg">
          {message.content}
        </div>
        {message.attachment_name && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] text-ink-3">
            <FileText className="size-3" /> {message.attachment_name}
          </span>
        )}
      </div>
      <Avatar name={user?.name || user?.email || '?'} src={user?.avatar_url} className="mt-0.5 size-8 shrink-0" />
    </motion.div>
  )
}

const STEPS = ['Reading your description', 'Routing to a desk', 'Extracting key facts', 'Assessing urgency', 'Drafting next step']

export function ThinkingCard() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - started), 100)
    return () => clearInterval(id)
  }, [])
  const step = Math.min(STEPS.length - 1, Math.floor(elapsed / 1300))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex scroll-mt-4 gap-3" data-anchor>
      <div className="relative mt-1 size-8 shrink-0">
        <LogoMark className="size-8" />
        <span className="absolute -inset-1 animate-ping rounded-xl border border-accent/40" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium">Ledgerline</span>
          <span className="font-mono text-[11px] text-ink-3 tabular-nums">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-line bg-panel p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-scan bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
          <ol className="relative flex flex-col gap-2.5">
            {STEPS.map((label, i) => {
              const done = i < step
              const active = i === step
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    className={clsx(
                      'grid size-5 place-items-center rounded-full border text-[9px] transition-all duration-300',
                      done && 'border-accent bg-accent text-accent-ink',
                      active && 'border-accent text-accent',
                      !done && !active && 'border-line text-ink-3',
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : active ? <span className="size-1.5 animate-pulse rounded-full bg-accent" /> : i + 1}
                  </span>
                  <span className={clsx('transition-colors', done || active ? 'text-ink' : 'text-ink-3')}>{label}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </motion.div>
  )
}

export function ErrorNotice({ onRetry }: { onRetry?: () => void }) {
  const error = useCases((s) => s.error)
  const dismiss = useCases((s) => s.dismissError)
  if (!error) return null
  return <ErrorBody key={error.at} message={error.message} retryAfter={error.retryAfter} onRetry={onRetry} onDismiss={dismiss} />
}

function ErrorBody({
  message,
  retryAfter,
  onRetry,
  onDismiss,
}: {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/8 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
      <div className="flex-1">
        <div className="font-medium text-red-400">That didn't go through</div>
        <div className="mt-0.5 text-ink-2">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={remaining > 0}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs hover:border-line-strong disabled:opacity-50"
          >
            <RotateCcw className="size-3" /> {remaining > 0 ? `Retry in ${remaining}s` : 'Retry'}
          </button>
        )}
      </div>
      <button onClick={onDismiss} className="text-ink-3 hover:text-ink" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </motion.div>
  )
}

export function Messages({ messages }: { messages: CaseMessage[] }) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.id
  return (
    <>
      {messages.map((m) =>
        m.role === 'user' ? (
          <UserBubble key={m.id} message={m} />
        ) : m.advisory ? (
          <AdvisoryCard key={m.id} advisory={m.advisory} latest={m.id === lastAssistant} />
        ) : null,
      )}
    </>
  )
}
