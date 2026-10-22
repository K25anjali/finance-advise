import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { accountLabel } from '../lib/meta'
import { caseRef } from '../lib/ledger'
import type { CaseContext } from '../lib/types'
import { useCases } from '../store/useCases'
import { ChatComposer } from '../components/app/ChatComposer'
import { Sidebar } from '../components/app/Sidebar'
import { ErrorSheet, Messages, PendingReceipt, Tape } from '../components/app/Thread'
import { LinkProvider } from '../components/app/linking'
import { useStickToBottom } from '../lib/hooks'
import { Welcome } from '../components/app/Welcome'
import { Printing } from '../components/ui'
import { clearDraft, peekDraft } from '../lib/draft'

type LastSend = { kind: 'new'; text: string; file: File | null; context: CaseContext } | { kind: 'reply'; text: string; file: File | null }

const settle = { duration: 0.24, ease: [0.2, 0, 0, 1] as const }

/** Worksheet column (720) + margin (240) + gutter (32) at the wide breakpoint (design.md §5.3). */
const COLUMNS = 'mx-auto w-full max-w-[720px] wide:max-w-[992px]'

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
  // A note typed on the landing page (before sign-up) opens pre-filled here.
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

  const messages = current?.messages ?? []
  const scrollRef = useStickToBottom(`${messages.length}-${pending?.message.id ?? ''}-${error?.at ?? ''}`)
  const isNew = !caseId
  const showWelcome = isNew && !pending && !error

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
    <div className="flex h-dvh overflow-hidden">
      {/* The drawer stays open from 1200px; below that it slides out (design.md §5.3) */}
      <div className="hidden w-[264px] shrink-0 border-r border-rule-strong wide:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30 wide:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={settle}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[300px] border-r border-rule-strong shadow-(--lift-2) wide:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={settle}
              role="dialog"
              aria-label="Case drawer"
            >
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule px-4">
          <button onClick={() => setDrawer(true)} className="btn btn-quiet t-label -ml-2 wide:hidden" aria-label="Open case drawer">
            ☰ Cases
          </button>
          {current && !isNew ? (
            <div className="flex min-w-0 items-baseline gap-3">
              <span className="t-machine shrink-0 text-carbon">{caseRef(current.id)}</span>
              <h1 className="t-sm truncate font-medium">{current.title}</h1>
              {current.category && <span className="t-label hidden shrink-0 sm:inline">{accountLabel(current.category)}</span>}
            </div>
          ) : (
            <h1 className="t-label">{isNew ? 'New case' : ''}</h1>
          )}
        </header>

        <LinkProvider>
          <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
            {showWelcome ? (
              <Welcome onPick={(text, context) => setSeed({ text, context, key: Date.now() })}>
                <ChatComposer
                  key={seed?.key ?? 'new'}
                  mode="new"
                  initialText={seed?.text}
                  initialContext={seed?.context}
                  autoFocus
                  onSubmit={sendNew}
                />
              </Welcome>
            ) : currentLoading ? (
              <div className="grid flex-1 place-items-center">
                <Printing>OPENING THE FILE</Printing>
              </div>
            ) : (
              <div className={`${COLUMNS} flex flex-col gap-8 px-4 pt-6 pb-10`}>
                <Messages messages={messages} />
                {pending && (
                  <>
                    <PendingReceipt message={pending.message} />
                    <Tape />
                  </>
                )}
                <ErrorSheet onRetry={retry} />
                {!isNew && !current && !pending && !error && (
                  <p className="py-20 text-center text-graphite">This case isn't in the drawer anymore.</p>
                )}
              </div>
            )}
          </div>
        </LinkProvider>

        {!showWelcome && (isNew || current) && (
          <div className="shrink-0 bg-linear-to-t from-paper from-70% to-transparent pt-3 pb-3">
            <div className={`${COLUMNS} px-4`}>
              <div className="wide:pr-[272px]">
                {isNew ? (
                  <ChatComposer key="new-pending" mode="new" onSubmit={sendNew} />
                ) : (
                  current && <ChatComposer key={current.id} mode="reply" onSubmit={(t, f) => sendReply(t, f)} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
