import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ACCOUNTS } from '../lib/meta'
import { entryToText } from '../lib/entry'
import type { CaseContext, CaseDetail } from '../lib/types'
import { useCases } from '../store/useCases'
import { Composer } from '../components/app/Composer'
import { Sidebar } from '../components/app/Sidebar'
import { ErrorSheet, Messages, Thinking, UserMessage } from '../components/app/Thread'
import { useStickToBottom } from '../lib/hooks'
import { Welcome } from '../components/app/Welcome'
import { ChevronDownIcon, MenuIcon, PencilIcon, ShareIcon, TrashIcon } from '../components/icons'
import { Button, IconButton, Printing, ThemeToggle } from '../components/ui'
import { clearDraft, peekDraft } from '../lib/draft'
import '../styles/desk.css'

type LastSend = { kind: 'new'; text: string; file: File | null; context: CaseContext } | { kind: 'reply'; text: string; file: File | null }

export default function AppPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const current = useCases((s) => s.current)
  const currentLoading = useCases((s) => s.currentLoading)
  const pending = useCases((s) => s.pending)
  const error = useCases((s) => s.error)
  const loadList = useCases((s) => s.loadList)
  const open = useCases((s) => s.open)
  const clearCurrent = useCases((s) => s.clearCurrent)
  const create = useCases((s) => s.create)
  const reply = useCases((s) => s.reply)

  const [drawer, setDrawer] = useState(false)
  // A note carried over from before sign-up opens pre-filled here.
  const [seed, setSeed] = useState<{ text: string; context?: CaseContext; key: number } | null>(() => {
    const text = peekDraft()
    return text ? { text, key: Date.now() } : null
  })
  // Read in the initializer (React may call it twice in dev), clear once mounted.
  useEffect(() => clearDraft(), [])
  const lastSend = useRef<LastSend | null>(null)

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (caseId) open(caseId)
    else clearCurrent()
  }, [caseId, open, clearCurrent])

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  const messages = current?.messages ?? []
  const scrollRef = useStickToBottom(`${messages.length}-${pending?.message.id ?? ''}-${error?.at ?? ''}`)
  const isNew = !caseId
  const showWelcome = isNew && !pending && !error
  const account = current?.category ? ACCOUNTS[current.category] : null

  const sendNew = async (text: string, file: File | null, context: CaseContext) => {
    lastSend.current = { kind: 'new', text, file, context }
    const id = await create(text, context, file)
    if (id) navigate(`/app/c/${id}`, { replace: true })
  }

  const sendReply = (text: string, file: File | null) => {
    lastSend.current = { kind: 'reply', text, file }
    reply(text, file)
  }

  const retry = () => {
    const last = lastSend.current
    if (!last) return
    if (last.kind === 'new') sendNew(last.text, last.file, last.context)
    else sendReply(last.text, last.file)
  }

  return (
    <div className="dk-shell">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />

      <main ref={scrollRef} className="dk-main">
        <header className="dk-top">
          <div className="dk-top__left">
            <IconButton label="Open case drawer" size={40} className="dk-only-mobile" onClick={() => setDrawer(true)} aria-expanded={drawer} aria-controls="case-drawer">
              <MenuIcon size={20} />
            </IconButton>
            {current && !isNew ? (
              <CaseMenu current={current} />
            ) : (
              <h1 className="dk-top__title dk-top__static" style={{ margin: 0 }}>
                <span>New case</span>
              </h1>
            )}
          </div>
          <div className="dk-top__right">
            {account && !isNew && (
              <span className="dk-account-chip">
                <span>{account.code}</span> · {account.name}
              </span>
            )}
            <ThemeToggle />
            {current && !isNew && <ShareButton current={current} />}
          </div>
        </header>

        {showWelcome ? (
          <Welcome onPick={(text, context) => setSeed({ text, context, key: Date.now() })}>
            <Composer key={seed?.key ?? 'new'} mode="new" inline initialText={seed?.text} initialContext={seed?.context} autoFocus onSubmit={sendNew} />
          </Welcome>
        ) : currentLoading ? (
          <div className="dk-center">
            <Printing>OPENING THE FILE</Printing>
          </div>
        ) : (
          <>
            <div className="dk-thread">
              <div className="dk-col">
                <Messages messages={messages} />
                {pending && (
                  <>
                    <UserMessage message={pending.message} />
                    <Thinking />
                  </>
                )}
                <ErrorSheet onRetry={retry} />
                {!isNew && !current && !pending && !error && <p className="dk-center">This case isn’t in the drawer anymore.</p>}
              </div>
            </div>
            {isNew ? (
              <Composer key="new-pending" mode="new" onSubmit={sendNew} />
            ) : (
              current && <Composer key={current.id} mode="reply" account={account?.code} onSubmit={(t, f) => sendReply(t, f)} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

/** The case title as a ghost button; it opens rename and remove. */
function CaseMenu({ current }: { current: CaseDetail }) {
  const rename = useCases((s) => s.rename)
  const remove = useCases((s) => s.remove)
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setMenu(false)
    setConfirm(false)
  }

  const commit = () => {
    const v = inputRef.current?.value.trim()
    if (v && v !== current.title) rename(current.id, v)
    setEditing(false)
  }

  if (editing) {
    return (
      <>
        <label htmlFor="case-title" className="sr-only">
          Case title
        </label>
        <input
          id="case-title"
          ref={inputRef}
          autoFocus
          defaultValue={current.title}
          maxLength={200}
          className="dk-top__rename"
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={commit}
        />
      </>
    )
  }

  return (
    <>
      <button type="button" className="dk-top__title" aria-haspopup="menu" aria-expanded={menu} onClick={() => (menu ? close() : setMenu(true))}>
        <span>{current.title}</span>
        <ChevronDownIcon size={14} />
      </button>
      {menu && (
        <>
          <button type="button" className="dk-menu-scrim" aria-label="Close menu" tabIndex={-1} onClick={close} />
          <div className="dk-menu" role="menu" onKeyDown={(e) => e.key === 'Escape' && close()}>
            {confirm ? (
              <>
                <p className="dk-menu__confirm">Remove this case from the drawer for good?</p>
                <div className="dk-menu__row">
                  <Button
                    variant="outline"
                    size={38}
                    className="dk-btn-danger"
                    autoFocus
                    onClick={() => {
                      remove(current.id)
                      close()
                      navigate('/app')
                    }}
                  >
                    Remove
                  </Button>
                  <Button variant="ghost" size={38} onClick={() => setConfirm(false)}>
                    Keep
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="dk-menu__item"
                  autoFocus
                  onClick={() => {
                    close()
                    setEditing(true)
                  }}
                >
                  <PencilIcon size={16} />
                  Rename
                </button>
                <button type="button" role="menuitem" className="dk-menu__item dk-menu__item--danger" onClick={() => setConfirm(true)}>
                  <TrashIcon size={16} strokeWidth={1.8} />
                  Remove…
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

/** Cases are private, so Share hands over the entry itself: the share sheet where there is one, else the clipboard. */
function ShareButton({ current }: { current: CaseDetail }) {
  const [copied, setCopied] = useState(false)
  const latest = current.messages.findLast((m) => m.advisory)?.advisory
  if (!latest) return null

  const share = async () => {
    const text = entryToText(latest)
    try {
      if (navigator.share) {
        await navigator.share({ title: current.title, text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // share dismissed or clipboard unavailable
    }
  }

  return (
    <Button variant="outline" size={38} onClick={share} aria-label={copied ? 'Entry copied' : 'Share the latest entry'}>
      <ShareIcon size={16} className="dk-only-mobile" />
      <span className="dk-share-label">{copied ? 'Copied' : 'Share'}</span>
    </Button>
  )
}
