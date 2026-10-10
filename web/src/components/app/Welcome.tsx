import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { EXAMPLES } from '../../lib/meta'
import type { CaseContext } from '../../lib/types'
import { useAuth } from '../../store/useAuth'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const SUGGESTIONS = EXAMPLES.slice(0, 4)

export function Welcome({ onPick }: { onPick: (text: string, context?: CaseContext) => void }) {
  const user = useAuth((s) => s.user)
  const first = (user?.name || user?.email.split('@')[0] || '').split(' ')[0]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="label flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" /> New case
        </div>
        <h1 className="mt-3 font-display text-[44px] leading-[1.02] tracking-tight sm:text-[56px]">
          {greeting()}
          {first && `, ${first}`}.
          <br />
          <em className="text-ink-3">What's tangled up?</em>
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-ink-2">
          Describe it the way you'd tell a friend. We'll route it to the right desk, pull out the facts, judge the
          urgency and tell you what to do next — then keep the thread going as you add detail.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((ex, i) => (
          <motion.button
            key={ex.tag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            onClick={() => onPick(ex.text, ex.context)}
            className="group rounded-2xl border border-line bg-panel/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-panel"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{ex.tag}</span>
              <ArrowUpRight className="size-4 text-ink-3 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-3">{ex.text}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
