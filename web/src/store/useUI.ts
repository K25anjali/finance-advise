import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface UIState {
  /** null until the visitor picks one: the OS preference applies (index.html sets it before paint). */
  theme: Theme | null
  toggleTheme: () => void
}

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: null,
      toggleTheme: () => {
        const theme = current() === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = theme
        set({ theme })
      },
    }),
    { name: 'ledgerline-ui', version: 2 },
  ),
)

export const useTheme = () => useUI((s) => s.theme) ?? current()
