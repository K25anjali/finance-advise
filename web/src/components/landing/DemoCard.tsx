import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, CircleDollarSign, CornerDownRight, Footprints, Waves } from 'lucide-react'
import { ConfidenceRing, UrgencyBars } from '../Gauges'
import { LogoMark } from '../ui'

const QUESTION = "I can't make payroll this Friday. Two clients owe me $40k and they're 60 days late."
const COLOR = '#F2735A'

/** A looping, scripted conversation that shows the product without needing an account. */
export function DemoCard() {
  // 0: typing · 1: thinking · 2: answer
  const [phase, setPhase] = useState(0)
  const [typed, setTyped] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (phase !== 0) return
    if (typed < QUESTION.length) {
      const id = setTimeout(() => setTyped((n) => n + 1), 22)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setPhase(1), 450)
    return () => clearTimeout(id)
  }, [phase, typed])

  useEffect(() => {
    if (phase === 1) {
      const id = setTimeout(() => setPhase(2), 1500)
      return () => clearTimeout(id)
    }
    if (phase === 2) {
      const id = setTimeout(() => {
        setTyped(0)
        setPhase(0)
        setCycle((c) => c + 1)
      }, 7000)
      return () => clearTimeout(id)
    }
  }, [phase])

  return (
    <div className="flex flex-col gap-4" aria-label="Example conversation">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[14px] leading-relaxed text-bg">
          {QUESTION.slice(0, typed)}
          {phase === 0 && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-bg" />}
        </div>
      </div>

      <div className="flex min-h-[300px] gap-3">
        <LogoMark className="mt-1 size-7 shrink-0" />
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.div
              key={`think-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex h-10 items-center gap-1.5 rounded-2xl border border-line bg-panel px-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-accent"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          )}
          {phase === 2 && (
            <motion.div
              key={`answer-${cycle}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-bg/60 p-4 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{ background: `radial-gradient(120% 100% at 0% 0%, ${COLOR}22, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium"
                  style={{ background: `${COLOR}1f`, color: COLOR }}
                >
                  <span className="grid size-4.5 place-items-center rounded-full" style={{ background: `${COLOR}2a` }}>
                    <Waves className="size-3" />
                  </span>
                  Cash Flow
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#F0524F' }}>
                  <UrgencyBars urgency="critical" scale={0.65} /> Critical
                </span>
                <span className="ml-auto">
                  <ConfidenceRing value={0.97} color={COLOR} size={38} />
                </span>
              </div>
              <p className="relative mt-3 font-display text-[20px] leading-snug tracking-tight">
                Payroll for Friday is at risk because $40k in receivables is 60 days overdue.
              </p>
              <div className="relative mt-3 rounded-xl border border-accent/25 bg-accent-soft p-3">
                <div className="label flex items-center gap-1.5 !text-[9.5px] !text-accent">
                  <Footprints className="size-3" /> Next step
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed">
                  Today: call both clients for payment by Thursday, and ask your bank about a short-term line of credit
                  to bridge the gap.
                </p>
              </div>
              <div className="relative mt-2.5 flex flex-wrap gap-1.5 text-[11.5px] text-ink-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
                  <CircleDollarSign className="size-3 text-ink-3" /> $40,000 receivables
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1">
                  <CalendarClock className="size-3 text-ink-3" /> Friday
                </span>
              </div>
              <div className="relative mt-3 flex items-start gap-1.5 rounded-lg border border-line px-2.5 py-2 text-[12px] text-ink-2">
                <CornerDownRight className="mt-0.5 size-3 shrink-0 text-ink-3" /> What's your total payroll for Friday?
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
