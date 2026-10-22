import { create } from 'zustand'
import { ApiError, cases as api } from '../lib/api'
import type { CaseContext, CaseDetail, CaseMessage, CaseSummary } from '../lib/types'
import { handleAuthError } from './useAuth'

interface Pending {
  /** null while creating a brand-new case */
  caseId: string | null
  message: CaseMessage
}

interface CasesState {
  list: CaseSummary[]
  listLoaded: boolean
  current: CaseDetail | null
  currentLoading: boolean
  pending: Pending | null
  error: { message: string; status: number; retryAfter?: number; at: number } | null
  /** A follow-up question the composer should reply to. Bumping `nonce` re-triggers. */
  insert: { text: string; nonce: number } | null

  loadList: () => Promise<void>
  open: (id: string) => Promise<void>
  clearCurrent: () => void
  create: (text: string, context: CaseContext, file: File | null) => Promise<string | null>
  reply: (text: string, file: File | null) => Promise<void>
  cancel: () => void
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
  insertIntoComposer: (text: string) => void
  dismissError: () => void
  reset: () => void
}

let inflight: AbortController | null = null

const toSummary = (c: CaseDetail): CaseSummary => ({
  id: c.id,
  title: c.title,
  category: c.category,
  urgency: c.urgency,
  created_at: c.created_at,
  updated_at: c.updated_at,
  message_count: c.messages.length,
})

const optimistic = (text: string, file: File | null): CaseMessage => ({
  id: `pending-${Date.now()}`,
  role: 'user',
  content: text,
  attachment_name: file?.name ?? null,
  advisory: null,
  created_at: new Date().toISOString(),
})

function asError(err: unknown) {
  handleAuthError(err)
  const e = err instanceof ApiError ? err : new ApiError('Something went wrong.', -1)
  return { message: e.message, status: e.status, retryAfter: e.retryAfter, at: Date.now() }
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

export const useCases = create<CasesState>()((set, get) => ({
  list: [],
  listLoaded: false,
  current: null,
  currentLoading: false,
  pending: null,
  error: null,
  insert: null,

  loadList: async () => {
    try {
      set({ list: await api.list(), listLoaded: true })
    } catch (err) {
      handleAuthError(err)
      set({ listLoaded: true })
    }
  },

  open: async (id) => {
    if (get().current?.id === id) return
    inflight?.abort()
    set({ currentLoading: true, error: null, pending: null })
    try {
      set({ current: await api.get(id), currentLoading: false })
    } catch (err) {
      set({ current: null, currentLoading: false, error: asError(err) })
    }
  },

  clearCurrent: () => {
    inflight?.abort()
    set({ current: null, pending: null, error: null })
  },

  create: async (text, context, file) => {
    inflight?.abort()
    inflight = new AbortController()
    set({ current: null, pending: { caseId: null, message: optimistic(text, file) }, error: null })
    try {
      const detail = await api.create(text, context, file, inflight.signal)
      set((s) => ({ current: detail, pending: null, list: [toSummary(detail), ...s.list] }))
      return detail.id
    } catch (err) {
      if (isAbort(err)) return null
      set({ pending: null, error: asError(err) })
      return null
    } finally {
      inflight = null
    }
  },

  reply: async (text, file) => {
    const current = get().current
    if (!current) return
    inflight?.abort()
    inflight = new AbortController()
    set({ pending: { caseId: current.id, message: optimistic(text, file) }, error: null })
    try {
      const detail = await api.reply(current.id, text, file, inflight.signal)
      set((s) => ({
        current: detail,
        pending: null,
        list: [toSummary(detail), ...s.list.filter((c) => c.id !== detail.id)],
      }))
    } catch (err) {
      if (isAbort(err)) return
      set({ pending: null, error: asError(err) })
    } finally {
      inflight = null
    }
  },

  cancel: () => {
    inflight?.abort()
    inflight = null
    set({ pending: null })
  },

  rename: async (id, title) => {
    const prev = get().list
    set((s) => ({
      list: s.list.map((c) => (c.id === id ? { ...c, title } : c)),
      current: s.current?.id === id ? { ...s.current, title } : s.current,
    }))
    try {
      await api.rename(id, title)
    } catch (err) {
      handleAuthError(err)
      set({ list: prev })
    }
  },

  remove: async (id) => {
    const prev = get().list
    set((s) => ({ list: s.list.filter((c) => c.id !== id), current: s.current?.id === id ? null : s.current }))
    try {
      await api.remove(id)
    } catch (err) {
      handleAuthError(err)
      set({ list: prev })
    }
  },

  insertIntoComposer: (text) => set((s) => ({ insert: { text, nonce: (s.insert?.nonce ?? 0) + 1 } })),
  dismissError: () => set({ error: null }),
  reset: () => {
    inflight?.abort()
    set({ list: [], listLoaded: false, current: null, pending: null, error: null, insert: null })
  },
}))
