import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { STAMPS } from '../../lib/meta'
import { stampSeed } from '../../lib/ledger'
import type { Urgency } from '../../lib/types'

/** One stamp per entry, rotated and grained from the request ID so it never shifts between renders. */
export function Stamp({ urgency, seed, press = false, delay = 0, className }: {
  urgency: Urgency
  seed: string
  press?: boolean
  delay?: number
  className?: string
}) {
  const s = STAMPS[urgency]
  const { rot, grain } = stampSeed(seed)
  return (
    <span
      className={clsx('stamp', className)}
      data-solid={s.solid || undefined}
      data-press={press || undefined}
      style={{ '--stamp-ink': s.ink, '--rot': rot, '--grain': grain, '--delay': `${delay}ms` } as CSSProperties}
      aria-label={`Urgency: ${s.spoken}`}
      role="img"
    >
      <span aria-hidden>{s.text}</span>
    </span>
  )
}
