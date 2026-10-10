import { useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Check, LogOut, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import { CATEGORY_META, URGENCY_META } from '../../lib/meta'
import type { CaseSummary } from '../../lib/types'
import { useAuth } from '../../store/useAuth'
import { useCases } from '../../store/useCases'
import { Avatar, Logo, ThemeToggle } from '../ui'

function groupByDate(list: CaseSummary[]) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const today = startOfDay(new Date())
  const day = 86_400_000
  const groups: [string, CaseSummary[]][] = [
    ['Today', []],
    ['Yesterday', []],
    ['Previous 7 days', []],
    ['Older', []],
  ]
  for (const c of list) {
    const t = startOfDay(new Date(c.updated_at))
    const idx = t >= today ? 0 : t >= today - day ? 1 : t >= today - 7 * day ? 2 : 3
    groups[idx][1].push(c)
  }
  return groups.filter(([, items]) => items.length)
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const list = useCases((s) => s.list)
  const listLoaded = useCases((s) => s.listLoaded)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? list.filter((c) => c.title.toLowerCase().includes(q)) : list
  }, [list, query])

  return (
    <aside className="flex h-full w-full flex-col bg-panel/60">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <NavLink to="/" aria-label="Ledgerline home">
          <Logo sub={false} />
        </NavLink>
        <ThemeToggle />
      </div>

      <div className="px-3">
        <button
          onClick={() => {
            navigate('/app')
            onNavigate?.()
          }}
          className="flex w-full items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="size-4" /> New case
        </button>
        <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-panel-2/50 px-3 py-2 text-sm focus-within:border-accent/60">
          <Search className="size-3.5 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases"
            className="w-full bg-transparent placeholder:text-ink-3 outline-none"
          />
        </label>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        {!listLoaded ? (
          <div className="space-y-2 px-2 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-panel-2/70" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 pt-6 text-center text-xs text-ink-3">
            {query ? 'No cases match.' : 'Your cases will appear here.'}
          </p>
        ) : (
          groupByDate(filtered).map(([label, items]) => (
            <div key={label} className="mb-3">
              <div className="label px-2.5 pt-2 pb-1.5 !text-[10px]">{label}</div>
              <AnimatePresence initial={false}>
                {items.map((c) => (
                  <CaseRow key={c.id} c={c} onNavigate={onNavigate} />
                ))}
              </AnimatePresence>
            </div>
          ))
        )}
      </nav>

      <UserMenu />
    </aside>
  )
}

function CaseRow({ c, onNavigate }: { c: CaseSummary; onNavigate?: () => void }) {
  const rename = useCases((s) => s.rename)
  const remove = useCases((s) => s.remove)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const color = c.category ? CATEGORY_META[c.category].color : 'var(--ink-3)'

  const commit = () => {
    const v = inputRef.current?.value.trim()
    if (v && v !== c.title) rename(c.id, v)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="group relative"
    >
      {editing ? (
        <div className="flex items-center gap-1 rounded-lg bg-panel-2 px-2 py-1.5">
          <input
            ref={inputRef}
            autoFocus
            defaultValue={c.title}
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            onBlur={commit}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
          <Check className="size-3.5 text-accent" />
        </div>
      ) : (
        <NavLink
          to={`/app/c/${c.id}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 pr-8 text-[13px] transition-colors',
              isActive ? 'bg-panel-2 text-ink' : 'text-ink-2 hover:bg-panel-2/60 hover:text-ink',
            )
          }
        >
          <span className="size-2 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="min-w-0 flex-1 truncate">{c.title}</span>
          {c.urgency && (c.urgency === 'critical' || c.urgency === 'high') && (
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: URGENCY_META[c.urgency].color }} />
          )}
        </NavLink>
      )}

      {!editing && (
        <button
          onClick={() => setMenu((v) => !v)}
          className={clsx(
            'absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md text-ink-3 transition-opacity hover:bg-panel hover:text-ink',
            menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
          aria-label="Case actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      )}

      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => (setMenu(false), setConfirm(false))} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute top-8 right-1 z-40 w-40 rounded-xl border border-line bg-panel p-1 shadow-xl shadow-black/30"
            >
              {confirm ? (
                <div className="p-2">
                  <p className="text-xs text-ink-2">Delete this case for good?</p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => {
                        remove(c.id)
                        setMenu(false)
                        if (location.pathname.endsWith(c.id)) navigate('/app')
                      }}
                      className="flex-1 rounded-md bg-red-500/90 py-1 text-xs font-medium text-white"
                    >
                      Delete
                    </button>
                    <button onClick={() => setConfirm(false)} className="grid size-6 place-items-center rounded-md hover:bg-panel-2">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MenuItem
                    icon={<Pencil className="size-3.5" />}
                    onClick={() => {
                      setMenu(false)
                      setEditing(true)
                    }}
                  >
                    Rename
                  </MenuItem>
                  <MenuItem icon={<Trash2 className="size-3.5" />} onClick={() => setConfirm(true)} danger>
                    Delete
                  </MenuItem>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: ReactNode
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-panel-2',
        danger ? 'text-red-400' : 'text-ink-2 hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function UserMenu() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const resetCases = useCases((s) => s.reset)
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1">
        <Avatar name={user.name || user.email} src={user.avatar_url} className="size-9" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium">{user.name || user.email.split('@')[0]}</div>
          <div className="truncate text-[11px] text-ink-3">{user.email}</div>
        </div>
        <button
          onClick={async () => {
            await logout()
            resetCases()
            navigate('/')
          }}
          className="grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}
