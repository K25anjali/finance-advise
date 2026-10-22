import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Links an extracted fact in a ledger entry to where it appears in the owner's receipt (design.md §6.5).
 */
const Ctx = createContext<{ active: string | null; setActive: (k: string | null) => void }>({
  active: null,
  setActive: () => {},
})

export function LinkProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null)
  return <Ctx.Provider value={{ active, setActive }}>{children}</Ctx.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useLink = () => useContext(Ctx)
