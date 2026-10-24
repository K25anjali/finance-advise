import { useEffect, useRef } from 'react'

/**
 * When the thread changes, bring the newest reply into view — aligned to its *top*, so a long
 * answer is read from the start (elements opt in with `data-anchor`).
 */
export function useStickToBottom(trigger: unknown) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const anchors = root.querySelectorAll<HTMLElement>('[data-anchor]')
    const last = anchors[anchors.length - 1]
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' })
  }, [trigger])
  return ref
}
