import { useEffect, useId, useLayoutEffect, useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { MAX_CHARS, MIN_CHARS, REVENUE_OPTIONS, URGENCY_HINTS, US_STATES } from '../../lib/meta'
import type { CaseContext } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { Staple } from '../ui'

const MAX_FILE_BYTES = 5 * 1024 * 1024

interface Props {
  mode: 'new' | 'reply'
  onSubmit: (text: string, file: File | null, context: CaseContext) => void
  /** Prefill (e.g. from an example slip). Remount with a new `key` to apply a new seed. */
  initialText?: string
  initialContext?: CaseContext
  autoFocus?: boolean
}

/** The intake slip: receipt paper being fed in, torn along the top (design.md §6.1). */
export function ChatComposer({ mode, onSubmit, initialText = '', initialContext = {}, autoFocus }: Props) {
  const pending = useCases((s) => s.pending)
  const cancel = useCases((s) => s.cancel)

  const [text, setText] = useState(initialText)
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState<CaseContext>(initialContext)
  const [details, setDetails] = useState(false)
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
    el.style.height = `${Math.min(el.scrollHeight, 264)}px`
  }, [text])

  const focusEnd = () =>
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })

  // Choosing a question in the margin makes this note an answer to it.
  const [quote, setQuote] = useState<string | null>(null)
  useEffect(
    () =>
      useCases.subscribe((s, prev) => {
        if (!s.insert || s.insert === prev.insert) return
        setQuote(s.insert.text)
        focusEnd()
      }),
    [],
  )

  useEffect(() => {
    if (autoFocus) focusEnd()
  }, [autoFocus])

  const send = () => {
    if (!canSend) return
    // The question rides along as a quote line so the model knows what is being answered.
    onSubmit(quote ? `> ${quote}\n\n${text.trim()}` : text.trim(), file, context)
    setQuote(null)
    setText('')
    setFile(null)
    setDetails(false)
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

  const filled = Object.values(context).filter(Boolean) as string[]

  return (
    <div>
      <div
        className="paper-shadow"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className={clsx('receipt torn-top relative px-4 pb-3 sm:px-5', dragging && 'outline-2 -outline-offset-8 outline-carbon outline-dashed')}>
          {dragging && (
            <div className="t-label absolute inset-0 z-10 grid place-items-center bg-receipt/90 !text-carbon">Drop a PDF or TXT to staple it on</div>
          )}

          {quote && (
            <div className="t-machine mb-2 flex items-start gap-3 text-carbon">
              <span className="min-w-0 flex-1">RE: {quote}</span>
              <button onClick={() => setQuote(null)} className="t-label shrink-0 !text-carbon hover:underline">
                Not this
              </button>
            </div>
          )}

          {file && (
            <div className="t-machine mb-2 inline-flex max-w-full items-center gap-2 border border-dashed border-rule-strong px-2 py-0.5 text-ink">
              <Staple className="h-3 w-5 shrink-0 text-graphite" />
              <span className="truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="t-label shrink-0 hover:text-ink" aria-label="Remove file">
                Unstaple
              </button>
            </div>
          )}

          <textarea
            ref={ref}
            value={text}
            rows={mode === 'new' ? 3 : 1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={
              mode === 'new'
                ? "Tell it the way you'd tell your accountant. Dump it all in; we'll sort it."
                : quote
                  ? 'Your answer…'
                  : 'Add to the file: more detail, a correction, an answer…'
            }
            className="block max-h-[264px] w-full resize-none bg-transparent text-ink outline-none placeholder:text-pencil"
            aria-label="Your note"
          />

          {mode === 'new' && (
            <div className="mt-2 border-t border-dashed border-rule-strong pt-2">
              <button
                type="button"
                onClick={() => setDetails((v) => !v)}
                aria-expanded={details}
                className="t-label inline-flex items-center gap-1 hover:text-ink"
              >
                <span className={clsx('transition-transform', details && 'rotate-90')}>›</span>
                Details <span className="font-normal normal-case tracking-normal text-pencil">(optional)</span>
                {!details && filled.length > 0 && <span className="ml-1 truncate font-sans normal-case tracking-normal text-ink">{filled.join(' · ')}</span>}
              </button>
              {details && <ContextFields context={context} onChange={setContext} />}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn btn-quiet -ml-2" title="Attach a PDF or TXT">
              <Staple /> <span className="hidden sm:inline">Attach</span>
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
            <span className="t-machine figures ml-auto text-pencil">
              {fileError ? <span className="text-ink">ⓘ {fileError}</span> : len > 0 && `${len}/${MAX_CHARS}`}
            </span>
            {busy ? (
              <button onClick={cancel} className="btn btn-ink">
                Stop
              </button>
            ) : (
              <button onClick={send} disabled={!canSend} className="btn btn-primary" title="File it (Enter)">
                {mode === 'new' ? 'Sort this out' : 'Add to the file'}
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="t-fine mt-2 hidden text-center sm:block">Enter to file · Shift + Enter for a new line</p>
    </div>
  )
}

function ContextFields({ context, onChange }: { context: CaseContext; onChange: (c: CaseContext) => void }) {
  const id = useId()
  const set = (k: keyof CaseContext) => (v: string) => onChange({ ...context, [k]: v || undefined })
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
      <label className="block" htmlFor={`${id}-b`}>
        <span className="t-label">Business</span>
        <input
          id={`${id}-b`}
          className="line-field t-sm"
          value={context.business_type ?? ''}
          maxLength={200}
          placeholder="Restaurant, salon…"
          onChange={(e) => set('business_type')(e.target.value)}
        />
      </label>
      <Select id={`${id}-s`} label="State" value={context.state} options={US_STATES} empty="Any / not US" onChange={set('state')} />
      <Select id={`${id}-r`} label="Revenue" value={context.annual_revenue} options={REVENUE_OPTIONS} empty="Rather not say" onChange={set('annual_revenue')} />
      <Select id={`${id}-u`} label="Timing" value={context.urgency_hint} options={URGENCY_HINTS} empty="Not sure" onChange={set('urgency_hint')} />
    </div>
  )
}

function Select({ id, label, value, options, empty, onChange }: {
  id: string
  label: string
  value?: string
  options: string[]
  empty: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="t-label">{label}</span>
      <select id={id} className="line-field t-sm" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
