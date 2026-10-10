import { create } from 'zustand'
import { ApiError, auth } from '../lib/api'
import type { Providers, User } from '../lib/types'

type AuthStatus = 'unknown' | 'authed' | 'guest'

interface AuthState {
  user: User | null
  status: AuthStatus
  providers: Providers
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  /** Called when any API request reports the session is gone. */
  expire: () => void
}

let booting: Promise<void> | null = null

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  providers: { google: false, github: false },

  bootstrap: () => {
    booting ??= (async () => {
      auth.providers().then((providers) => set({ providers })).catch(() => {})
      try {
        set({ user: await auth.me(), status: 'authed' })
      } catch {
        set({ user: null, status: 'guest' })
      }
    })()
    return booting
  },

  login: async (email, password) => {
    const user = await auth.login(email, password)
    set({ user, status: 'authed' })
  },

  signup: async (email, password, name) => {
    const user = await auth.signup(email, password, name)
    set({ user, status: 'authed' })
  },

  logout: async () => {
    try {
      await auth.logout()
    } finally {
      set({ user: null, status: 'guest' })
    }
  },

  expire: () => set({ user: null, status: 'guest' }),
}))

/** Route 401s from data calls back into the auth store. */
export function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) useAuth.getState().expire()
}
