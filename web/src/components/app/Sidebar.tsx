import { useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import clsx from 'clsx'
import { BRAND } from '../../lib/meta'
import { useAuth } from '../../store/useAuth'
import { useCases } from '../../store/useCases'
import { useUI } from '../../store/useUI'
import { CloseIcon, PanelIcon, PlusIcon, SearchIcon, SignOutIcon } from '../icons'
import { Avatar, IconButton, Logo, Printing, UrgencyDot } from '../ui'

/** How many cases "Recents" shows before "Show all" opens the whole list. */
const RECENT_LIMIT = 8

/**
 * The case sidebar: new case, search, recents and the signed-in owner.
 * On desktop it can fold to an icon rail; below 860px it is a slide-over (`open`).
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const list = useCases((s) => s.list)
  const listLoaded = useCases((s) => s.listLoaded)
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggleCollapsed = useUI((s) => s.toggleSidebar)
  const navigate = useNavigate()

  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? list.filter((c) => c.title.toLowerCase().includes(q)) : list
  }, [list, query])
  const shown = showAll || query ? filtered : filtered.slice(0, RECENT_LIMIT)

  // The rail only applies on desktop; the mobile drawer always shows the full sidebar.
  const rail = collapsed && !open

  const openSearch = () => {
    if (collapsed) toggleCollapsed()
    setSearching((v) => !v || collapsed)
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <>
      {open && <button type="button" className="dk-scrim" aria-label="Close case drawer" onClick={onClose} />}
      <nav
        id="case-drawer"
        aria-label="Case drawer"
        className={clsx('dk-side', rail && 'dk-side--rail', open && 'dk-side--open')}
      >
        <div className="dk-side__head">
          <Link to="/" className="dk-side__brand" aria-label={`${BRAND} home`}>
            <Logo size="sm" wordmark={!rail} />
          </Link>
          <IconButton
            label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
            className="dk-collapse"
            onClick={toggleCollapsed}
            aria-expanded={!rail}
            aria-controls="case-drawer"
          >
            <PanelIcon size={18} />
          </IconButton>
          <IconButton label="Close case drawer" className="dk-only-mobile" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </div>

        <button
          type="button"
          className="dk-side-item dk-side-item--new"
          onClick={() => {
            navigate('/app')
            onClose()
          }}
          title={rail ? 'New case' : undefined}
        >
          <span className="dk-side-item__plus">
            <PlusIcon size={13} strokeWidth={3} />
          </span>
          <span className={clsx(rail && 'sr-only')}>New case</span>
        </button>
        <button type="button" className="dk-side-item" onClick={openSearch} aria-pressed={searching && !rail} title={rail ? 'Search' : undefined}>
          <SearchIcon size={20} />
          <span className={clsx(rail && 'sr-only')}>Search</span>
        </button>

        {!rail && (
          <>
            {searching && (
              <div className="dk-side-search">
                <label htmlFor="drawer-search" className="sr-only">
                  Search cases
                </label>
                <input
                  id="drawer-search"
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setQuery('')
                      setSearching(false)
                    }
                  }}
                  placeholder="Search the drawer"
                  type="search"
                />
              </div>
            )}

            <div className="dk-side__label">{query ? 'Matches' : showAll ? `All cases · ${list.length}` : 'Recents'}</div>
            {!listLoaded ? (
              <div className="dk-side__empty">
                <Printing>OPENING THE DRAWER</Printing>
              </div>
            ) : shown.length === 0 ? (
              <p className="dk-side__empty">{query ? 'Nothing in the drawer matches.' : 'No cases on file yet.'}</p>
            ) : (
              <ul className="dk-side__list">
                {shown.map((c) => (
                  <li key={c.id}>
                    <NavLink to={`/app/c/${c.id}`} className="dk-recent" onClick={onClose}>
                      <UrgencyDot urgency={c.urgency} />
                      <span className="dk-recent__title">{c.title}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
            {!query && !showAll && filtered.length > RECENT_LIMIT && (
              <button type="button" className="dk-side-item dk-side__more" onClick={() => setShowAll(true)}>
                Show all {filtered.length} cases
              </button>
            )}
          </>
        )}

        <UserRow rail={rail} />
      </nav>
    </>
  )
}

function UserRow({ rail }: { rail: boolean }) {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const resetCases = useCases((s) => s.reset)
  const navigate = useNavigate()
  if (!user) return null
  const name = user.name || user.email.split('@')[0]

  return (
    <div className="dk-side__user">
      <Avatar name={name} src={user.avatar_url} />
      {!rail && (
        <span className="dk-side__who">
          <span className="dk-side__name">{name}</span>
          <span className="dk-side__plan">{user.email}</span>
        </span>
      )}
      <IconButton
        label="Sign out"
        size={40}
        onClick={async () => {
          await logout()
          resetCases()
          navigate('/')
        }}
      >
        <SignOutIcon size={18} />
      </IconButton>
    </div>
  )
}
