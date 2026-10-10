import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
    }),
    { name: 'ledgerline-ui', version: 1 },
  ),
)
