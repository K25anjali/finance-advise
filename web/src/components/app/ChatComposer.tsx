import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Building2, FileText, MapPin, Paperclip, Square, TrendingUp, Timer, X } from 'lucide-react'
import clsx from 'clsx'
import { MAX_CHARS, MIN_CHARS, REVENUE_OPTIONS, URGENCY_HINTS, US_STATES } from '../../lib/meta'
import type { CaseContext } from '../../lib/types'
import { useCases } from '../../store/useCases'

const MAX_FILE_BYTES = 5 * 1024 * 1024

interface Props {
  mode: 'new' | 'reply'
  onSubmit: (text: string, file: File | null, context: CaseContext) => void
  /** Prefill (e.g. from a suggestion card). Remount with a new `key` to apply a new seed. */
  initialText?: string
  initialContext?: CaseContext
  autoFocus?: boolean
}

export function ChatComposer({ mode, onSubmit, initialText = '', initialContext = {}, autoFocus }: Props) {
  const pending = useCases((s) => s.pending)
  const cancel = useCases((s) => s.cancel)

  const [text, setText] = useState(initialText)
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState<CaseContext>(initialContext)
  const [panel, setPanel] = useState<keyof CaseContext | null>(null)
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const busy = pending !== null
  const len = text.trim().length
  const min = mode === 'new' ? MIN_CHARS : 2
  const canSend = !busy && len >= min && len <= MAX_CHARS

  // Auto-grow up to ~10 lines.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`
  }, [text])

  const focusEnd = () =>
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })

  // Follow-up answers clicked in the thread get appended here.
  useEffect(
    () =>
      useCases.subscribe((s, prev) => {
        if (!s.insert || s.insert === prev.insert) return
        const add = s.insert.text
        setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${add}` : add))
        focusEnd()
      }),
    [],
  )

  useEffect(() => {
    if (autoFocus) focusEnd()
  }, [autoFocus])

  const send = () => {
    if (!canSend) return
    onSubmit(text.trim(), file, context)
    setText('')
    setFile(null)
    setPanel(null)
  }

  const acceptFile = (f: File | undefined) => {
    setFileError(null)
    if (!f) return
    if (!/\.(pdf|txt)$/i.test(f.name)) return setFileError('Only .pdf or .txt')
    if (f.size > MAX_FILE_BYTES) return setFileError('Max 5 MB')
    setFile(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const contextChips: { key: keyof CaseContext; icon: typeof Building2; label: string }[] = [
    { key: 'business_type', icon: Building2, label: 'Business' },
    { key: 'annual_revenue', icon: TrendingUp, label: 'Revenue' },
    { key: 'state', icon: MapPin, label: 'State' },
    { key: 'urgency_hint', icon: Timer, label: 'Urgency' },
  ]

  return (
    <div className="relative">
      <AnimatePresence>
        {mode === 'new' && panel && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-line bg-panel p-3 shadow-2xl shadow-black/30"
          >
            <ContextEditor
              field={panel}
              value={context[panel] ?? ''}
              onChange={(v) => setContext((c) => ({ ...c, [panel]: v || undefined }))}
              onDone={() => {
                setPanel(null)
                ref.current?.focus()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'relative rounded-2xl border bg-panel shadow-xl shadow-black/10 transition-all focus-within:border-accent/60 dark:shadow-black/40',
          dragging ? 'border-accent glow-ring' : 'border-line',
        )}
      >
        {dragging && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-panel/90 text-sm text-accent">
            Drop a PDF or TXT to attach
          </div>
        )}

        {file && (
          <div className="mx-3 mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs">
            <FileText className="size-3.5 text-accent" />
            <span className="max-w-[16rem] truncate text-ink-2">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-ink-3 hover:text-ink" aria-label="Remove file">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <textarea
          ref={ref}
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={
            mode === 'new'
              ? "Describe what's going on with your business finances…"
              : 'Answer a question or add more detail…'
          }
          className="block max-h-[260px] min-h-[56px] w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed placeholder:text-ink-3 outline-none"
          aria-label="Message"
        />

        <div className="flex items-center gap-1 px-2.5 pb-2.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink"
            title="Attach a PDF or TXT"
          >
            <Paperclip className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              acceptFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />

          {mode === 'new' &&
            contextChips.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setPanel(panel === key ? null : key)}
                className={clsx(
                  'hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors sm:flex',
                  context[key]
                    ? 'bg-accent-soft text-accent'
                    : panel === key
                      ? 'bg-panel-2 text-ink'
                      : 'text-ink-3 hover:bg-panel-2 hover:text-ink',
                )}
              >
                <Icon className="size-3.5" />
                <span className="max-w-[7rem] truncate">{context[key] || label}</span>
              </button>
            ))}

          <span className="ml-auto pr-2 font-mono text-[10.5px] text-ink-3 tabular-nums">
            {fileError ? <span className="text-red-400">{fileError}</span> : len > 0 && `${len}/${MAX_CHARS}`}
          </span>

          {busy ? (
            <button
              onClick={cancel}
              className="grid size-9 place-items-center rounded-xl bg-ink text-bg transition-transform hover:scale-105"
              title="Stop"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!canSend}
              className="grid size-9 place-items-center rounded-xl bg-accent text-accent-ink transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-30"
              title="Send (Enter)"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-3">
        Enter to send · Shift + Enter for a new line · AI triage, not professional advice
      </p>
    </div>
  )
}

function ContextEditor({
  field,
  value,
  onChange,
  onDone,
}: {
  field: keyof CaseContext
  value: string
  onChange: (v: string) => void
  onDone: () => void
}) {
  const title = {
    business_type: 'What kind of business?',
    annual_revenue: 'Annual revenue',
    state: 'Which US state?',
    urgency_hint: 'How urgent does it feel?',
  }[field]

  return (
    <div>
      <div className="label mb-2">{title}</div>
      {field === 'business_type' && (
        <input
          autoFocus
          className="field"
          value={value}
          maxLength={200}
          placeholder="Restaurant, SaaS, salon…"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onDone()}
        />
      )}
      {field === 'state' && (
        <select autoFocus className="field" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Any / not US</option>
          {US_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      {(field === 'annual_revenue' || field === 'urgency_hint') && (
        <div className="flex flex-wrap gap-1.5">
          {(field === 'annual_revenue' ? REVENUE_OPTIONS : URGENCY_HINTS).map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(value === o ? '' : o)
                onDone()
              }}
              className={clsx('chip', value === o && '!border-accent !text-accent')}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-between">
        <button onClick={() => onChange('')} className="text-xs text-ink-3 hover:text-ink">
          Clear
        </button>
        <button onClick={onDone} className="text-xs font-medium text-accent">
          Done
        </button>
      </div>
    </div>
  )
}
