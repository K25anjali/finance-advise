import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { CATEGORY_META } from '../lib/meta'
import type { CaseContext } from '../lib/types'
import { useCases } from '../store/useCases'
import { ChatComposer } from '../components/app/ChatComposer'
import { Sidebar } from '../components/app/Sidebar'
import { ErrorNotice, Messages, ThinkingCard, UserBubble } from '../components/app/Thread'
import { useStickToBottom } from '../lib/hooks'
import { Welcome } from '../components/app/Welcome'
import { Spinner } from '../components/ui'

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
  const [seed, setSeed] = useState<{ text: string; context?: CaseContext; key: number } | null>(null)
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

  const meta = current?.category ? CATEGORY_META[current.category] : null

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden w-72 shrink-0 border-r border-line lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs border-r border-line bg-bg lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute top-4 right-[-44px] grid size-9 place-items-center rounded-full bg-panel text-ink"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line/70 bg-bg/70 px-4 backdrop-blur-md">
          <button
            onClick={() => setDrawer(true)}
            className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-panel-2 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          {current && !isNew ? (
            <div className="flex min-w-0 items-center gap-2.5">
              {meta && (
                <span className="size-2 shrink-0 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
              )}
              <h1 className="truncate text-sm font-medium">{current.title}</h1>
              {meta && <span className="hidden shrink-0 text-xs text-ink-3 sm:inline">· {meta.label}</span>}
            </div>
          ) : (
            <h1 className="text-sm font-medium text-ink-2">{isNew ? 'New case' : ''}</h1>
          )}
        </header>

        {/* Thread */}
        <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
          {showWelcome ? (
            <Welcome onPick={(text, context) => setSeed({ text, context, key: Date.now() })} />
          ) : currentLoading ? (
            <div className="grid flex-1 place-items-center text-ink-3">
              <Spinner className="size-6" />
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8">
              <Messages messages={messages} />
              {pending && (
                <>
                  <UserBubble message={pending.message} />
                  <ThinkingCard />
                </>
              )}
              <ErrorNotice onRetry={retry} />
              {!isNew && !current && !pending && !error && (
                <p className="py-20 text-center text-sm text-ink-3">This case doesn't exist anymore.</p>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 bg-gradient-to-t from-bg via-bg to-transparent px-4 pt-2 pb-4">
          <div className="mx-auto max-w-3xl">
            {isNew ? (
              <ChatComposer
                key={seed?.key ?? 'new'}
                mode="new"
                initialText={seed?.text}
                initialContext={seed?.context}
                autoFocus={!!seed}
                onSubmit={sendNew}
              />
            ) : (
              current && <ChatComposer key={current.id} mode="reply" onSubmit={(t, f) => sendReply(t, f)} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
