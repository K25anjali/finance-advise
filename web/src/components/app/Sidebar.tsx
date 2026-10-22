import { useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import clsx from 'clsx'
import { ACCOUNTS, BRAND, STAMPS } from '../../lib/meta'
import { caseRef, periodOf } from '../../lib/ledger'
import type { CaseSummary } from '../../lib/types'
import { useAuth } from '../../store/useAuth'
import { useCases } from '../../store/useCases'
import { Avatar, Logo, Printing, ThemeToggle } from '../ui'

/** Cases grouped by ledger period, newest first: OCTOBER 2026. */
function byPeriod(list: CaseSummary[]) {
  const groups = new Map<string, CaseSummary[]>()
  for (const c of list) {
    const p = periodOf(c.updated_at)
    groups.set(p, [...(groups.get(p) ?? []), c])
  }
  return [...groups]
}

/** The file drawer: past cases as folder tabs (design.md §6.9). */
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
    <aside className="flex h-full w-full flex-col bg-paper">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <NavLink to="/" aria-label={`${BRAND} home`}>
          <Logo />
        </NavLink>
        <ThemeToggle className="-mr-2" />
      </div>

      <div className="px-4">
        <button
          onClick={() => {
            navigate('/app')
            onNavigate?.()
          }}
          className="btn btn-ink w-full"
        >
          Open a new case
        </button>
        <label className="mt-3 block">
          <span className="sr-only">Search cases</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the drawer" className="line-field t-sm" />
        </label>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-3" aria-label="Cases">
        {!listLoaded ? (
          <div className="px-2 pt-2">
            <Printing>OPENING THE DRAWER</Printing>
          </div>
        ) : filtered.length === 0 ? (
          <p className="t-sm px-2 pt-4 text-graphite">{query ? 'Nothing in the drawer matches.' : 'No cases on file.'}</p>
        ) : (
          byPeriod(filtered).map(([period, items]) => (
            <div key={period} className="mb-4">
              <div className="t-label border-b border-rule-strong px-2 pb-1">{period}</div>
              {items.map((c) => (
                <CaseRow key={c.id} c={c} onNavigate={onNavigate} />
              ))}
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

  const commit = () => {
    const v = inputRef.current?.value.trim()
    if (v && v !== c.title) rename(c.id, v)
    setEditing(false)
  }

  return (
    <div className="group relative border-b border-rule">
      {editing ? (
        <div className="px-2 py-2">
          <input
            ref={inputRef}
            autoFocus
            defaultValue={c.title}
            maxLength={200}
            aria-label="Case title"
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            onBlur={commit}
            className="line-field t-sm"
          />
        </div>
      ) : (
        <NavLink
          to={`/app/c/${c.id}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'block px-2 py-2 pr-9 transition-colors duration-(--t-snap)',
              isActive ? 'sheet margin-rule' : 'hover:bg-sheet/60',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={clsx('flex items-center gap-2', isActive && 'pl-2')}>
                <span className="t-machine text-carbon">{caseRef(c.id)}</span>
                {c.category && <span className="t-label">{ACCOUNTS[c.category].code}</span>}
                {c.urgency && <UrgencyMark urgency={c.urgency} />}
              </span>
              <span className={clsx('t-sm mt-0.5 block truncate', isActive ? 'pl-2 text-ink' : 'text-graphite')}>{c.title}</span>
            </>
          )}
        </NavLink>
      )}

      {!editing && (
        <button
          onClick={() => setMenu((v) => !v)}
          className={clsx(
            'btn btn-quiet absolute top-2 right-1 !h-7 !px-1.5 tracking-widest',
            menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
          aria-label="Case actions"
          aria-expanded={menu}
        >
          ···
        </button>
      )}

      {menu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => (setMenu(false), setConfirm(false))} />
          <div className="sheet absolute top-9 right-1 z-40 w-44 p-1 shadow-(--lift-2)">
            {confirm ? (
              <div className="p-2">
                <p className="t-sm text-ink">Remove this case from the drawer for good?</p>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => {
                      remove(c.id)
                      setMenu(false)
                      if (location.pathname.endsWith(c.id)) navigate('/app')
                    }}
                    className="btn !h-8 flex-1 border border-stamp !text-[14px] text-stamp hover:bg-stamp hover:text-sheet"
                  >
                    Remove
                  </button>
                  <button onClick={() => setConfirm(false)} className="btn btn-quiet !h-8">
                    Keep
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    setMenu(false)
                    setEditing(true)
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem onClick={() => setConfirm(true)} danger>
                  Remove…
                </MenuItem>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** A dab of stamp ink: solid for act-today, outlined otherwise. The words are for screen readers. */
function UrgencyMark({ urgency }: { urgency: NonNullable<CaseSummary['urgency']> }) {
  const s = STAMPS[urgency]
  return (
    <span className="ml-auto inline-flex items-center">
      <span
        aria-hidden
        className="inline-block size-2 rounded-[1px] border-[1.5px]"
        style={{ borderColor: s.ink, background: s.solid ? s.ink : undefined }}
      />
      <span className="sr-only">Urgency: {s.spoken}</span>
    </span>
  )
}

function MenuItem({ children, onClick, danger }: { children: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx('t-sm block w-full rounded-[2px] px-2.5 py-1.5 text-left hover:bg-paper', danger ? 'text-stamp' : 'text-ink')}
    >
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
    <div className="flex items-center gap-3 border-t border-rule-strong px-4 py-3">
      <Avatar name={user.name || user.email} src={user.avatar_url} className="size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="t-sm truncate font-medium">{user.name || user.email.split('@')[0]}</div>
        <div className="t-fine truncate">{user.email}</div>
      </div>
      <button
        onClick={async () => {
          await logout()
          resetCases()
          navigate('/')
        }}
        className="btn btn-quiet t-label -mr-2"
      >
        Sign out
      </button>
    </div>
  )
}
