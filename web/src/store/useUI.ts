import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Mode = 'light' | 'dark'

/** Plain string, so index.html can read it before first paint. */
const MODE_KEY = 'untangle-mode'

const currentMode = (): Mode => (document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light')

interface UIState {
  /** Mirrors <html data-mode>; index.html sets it from the saved choice or the OS preference. */
  mode: Mode
  toggleMode: () => void
  /** Desktop sidebar folded to an icon rail. */
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      mode: currentMode(),
      toggleMode: () => {
        const mode = currentMode() === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.mode = mode
        try {
          localStorage.setItem(MODE_KEY, mode)
        } catch {
          // storage blocked: the choice lasts for this page only
        }
        set({ mode })
      },
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    // Mode lives under its own key; only layout preferences persist here.
    { name: 'untangle-ui', version: 3, partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)
