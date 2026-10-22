import { useMemo } from 'react'

/**
 * Banknote engraving: overlapping sine-modulated rings. Allowed in exactly two places, the brand lockup
 * and the landing hero, at very low contrast (design.md §6.13, D-015).
 */
export function Guilloche({ className, rings = 22, size = 640 }: { className?: string; rings?: number; size?: number }) {
  const paths = useMemo(() => {
    const c = size / 2
    const out: string[] = []
    for (let k = 0; k < rings; k++) {
      const base = size * 0.18 + k * ((size * 0.3) / rings)
      const amp = size * 0.035
      const phase = (k * Math.PI) / 11
      let d = ''
      for (let i = 0; i <= 720; i++) {
        const t = (i / 720) * Math.PI * 2
        const r = base + amp * Math.sin(12 * t + phase) + amp * 0.5 * Math.sin(5 * t - phase)
        d += `${i ? 'L' : 'M'}${(c + r * Math.cos(t)).toFixed(1)} ${(c + r * Math.sin(t)).toFixed(1)}`
      }
      out.push(d + 'Z')
    }
    return out
  }, [rings, size])

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden fill="none" stroke="var(--rule)" strokeWidth="0.6">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
