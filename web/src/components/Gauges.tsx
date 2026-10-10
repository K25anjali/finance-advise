import { useEffect, useState } from 'react'
import { animate, motion } from 'motion/react'
import { URGENCY_META } from '../lib/meta'
import type { Urgency } from '../lib/types'

function useCountUp(target: number, duration = 1.1) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const controls = animate(0, target, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setValue })
    return () => controls.stop()
  }, [target, duration])
  return value
}

/** Confidence ring with ticks at the 40% / 70% thresholds where the backend changes behaviour. */
export function ConfidenceRing({ value, color, size = 64 }: { value: number; color: string; size?: number }) {
  const stroke = Math.max(5, size / 12)
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const pct = useCountUp(Math.round(value * 100))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        {[0.4, 0.7].map((t) => (
          <circle
            key={t}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke + 3}
            strokeDasharray={`1.5 ${circumference}`}
            strokeDashoffset={-circumference * t}
            className="stroke-ink-3/60"
          />
        ))}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 5px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="font-mono font-semibold tabular-nums" style={{ fontSize: size / 4.2 }}>
          {Math.round(pct)}
          <span className="text-ink-3" style={{ fontSize: size / 7 }}>
            %
          </span>
        </div>
      </div>
    </div>
  )
}

export function UrgencyBars({ urgency, scale = 1 }: { urgency: Urgency; scale?: number }) {
  const meta = URGENCY_META[urgency]
  return (
    <div className="flex items-end gap-1" aria-label={`Urgency ${meta.label}, level ${meta.level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          initial={{ scaleY: 0.2, opacity: 0.3 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 380, damping: 22 }}
          className="origin-bottom rounded-[2px]"
          style={{
            width: 6 * scale,
            height: (6 + i * 4) * scale,
            background: i <= meta.level ? meta.color : 'var(--line)',
            boxShadow: i <= meta.level ? `0 0 8px ${meta.color}44` : undefined,
          }}
        />
      ))}
    </div>
  )
}
