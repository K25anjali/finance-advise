import { useEffect, useId, useLayoutEffect, useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { MAX_CHARS, MIN_CHARS, REVENUE_OPTIONS, URGENCY_HINTS, US_STATES } from '../../lib/meta'
import type { CaseContext } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { AccountsIcon, ArrowUpIcon, ChevronDownIcon, CloseIcon, PlusIcon, StopIcon } from '../icons'

const MAX_FILE_BYTES = 5 * 1024 * 1024

/** The business name given at sign-up, used as the default "Business" detail for new cases. */
function savedBusiness(): string | undefined {
  try {
    return localStorage.getItem('ll_business') || undefined
  } catch {
    return undefined
  }
}

interface Props {
  mode: 'new' | 'reply'
  onSubmit: (text: string, file: File | null, context: CaseContext) => void
  /** Prefill (e.g. from a specimen). Remount with a new `key` to apply a new seed. */
  initialText?: string
  initialContext?: CaseContext
  autoFocus?: boolean
  /** Account the case is filed to, e.g. "410"; "Auto" until the desk picks one. */
  account?: string
  /** Sits in the page flow (empty state) instead of sticking to the bottom. */
  inline?: boolean
}

/** White box with an auto-growing textarea; Enter files it, Shift+Enter adds a line. */
export function Composer({ mode, onSubmit, initialText = '', initialContext, autoFocus, account, inline }: Props) {
  const pending = useCases((s) => s.pending)
  const cancel = useCases((s) => s.cancel)
  const id = useId()

  const [text, setText] = useState(initialText)
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState<CaseContext>(() => initialContext ?? (mode === 'new' ? { business_type: savedBusiness() } : {}))
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

  // Choosing a question in an entry makes this note an answer to it.
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

  const placeholder =
    mode === 'new'
      ? 'Tell it the way you’d tell your accountant. Dump it all in; we’ll sort it.'
      : quote
        ? 'Your answer…'
        : 'Add to the file: more detail, a correction, an answer…'

  return (
    <div className={clsx('dk-composer', inline && 'dk-composer--inline')}>
      <div className="dk-composer__col">
        <div
          className={clsx('dk-box', dragging && 'dk-box--drag')}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {dragging && <div className="dk-box__drop">Drop a PDF or TXT to attach it</div>}

          {(quote || file) && (
            <div className="dk-box__chips">
              {quote && (
                <span className="dk-chip">
                  <span>Answering: {quote}</span>
                  <button type="button" onClick={() => setQuote(null)} aria-label="Stop answering this question">
                    <CloseIcon size={14} />
                  </button>
                </span>
              )}
              {file && (
                <span className="dk-chip dk-chip--file">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Remove file">
                    <CloseIcon size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          <label htmlFor={`${id}-note`} className="sr-only">
            {mode === 'new' ? 'Describe the money problem' : 'Add to the file'}
          </label>
          <textarea
            id={`${id}-note`}
            ref={ref}
            value={text}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={placeholder}
          />

          {details && <ContextFields context={context} onChange={setContext} />}

          <div className="dk-box__row">
            <button type="button" className="dk-box__tool dk-box__tool--icon" aria-label="Attach a notice (PDF or TXT)" title="Attach a notice (PDF or TXT)" onClick={() => fileRef.current?.click()}>
              <PlusIcon size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              hidden
              onChange={(e) => {
                acceptFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <span className="dk-box__tool dk-box__tool--static dk-hide-xs" title="Untangle picks the account from what you write">
              <AccountsIcon size={14} strokeWidth={2} />
              Account: {account ?? 'Auto'}
            </span>
            {mode === 'new' && (
              <button type="button" className="dk-box__tool" aria-expanded={details} onClick={() => setDetails((v) => !v)}>
                Details
                <ChevronDownIcon size={12} />
              </button>
            )}
            <span className={clsx('dk-box__count', (fileError || len > MAX_CHARS) && 'dk-box__count--warn')} aria-live="polite">
              {fileError ?? (len > MAX_CHARS * 0.8 ? `${len}/${MAX_CHARS}` : '')}
            </span>
            {busy ? (
              <button type="button" className="dk-send" onClick={cancel} aria-label="Stop">
                <StopIcon size={17} />
              </button>
            ) : (
              <button type="button" className="dk-send" onClick={send} disabled={!canSend} aria-label={mode === 'new' ? 'Sort this out' : 'Add to the file'}>
                <ArrowUpIcon size={17} />
              </button>
            )}
          </div>
        </div>
        <p className="dk-composer__note">Untangle is AI triage and can make mistakes. Check important decisions with a qualified advisor.</p>
      </div>
    </div>
  )
}

function ContextFields({ context, onChange }: { context: CaseContext; onChange: (c: CaseContext) => void }) {
  const id = useId()
  const set = (k: keyof CaseContext) => (v: string) => onChange({ ...context, [k]: v || undefined })
  return (
    <div className="dk-details">
      <label htmlFor={`${id}-b`}>
        Business
        <input
          id={`${id}-b`}
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
    <label htmlFor={id}>
      {label}
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
