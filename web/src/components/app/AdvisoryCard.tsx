import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Copy,
  CornerDownRight,
  Footprints,
  History,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { CATEGORY_META, URGENCY_META, confidenceBand } from '../../lib/meta'
import type { AdvisoryResponse } from '../../lib/types'
import { useCases } from '../../store/useCases'
import { ConfidenceRing, UrgencyBars } from '../Gauges'
import { LogoMark } from '../ui'

export function AdvisoryCard({ advisory, latest }: { advisory: AdvisoryResponse; latest: boolean }) {
  const meta = CATEGORY_META[advisory.category]
  const urgency = URGENCY_META[advisory.urgency]
  const Icon = meta.icon
  const isFallback = advisory.model_used === 'none'
  const f = advisory.extracted_fields
  const [open, setOpen] = useState(latest)

  return (
    <div className="flex scroll-mt-4 gap-3" data-anchor>
      <LogoMark className="mt-1 size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <MetaLine advisory={advisory} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-2 overflow-hidden rounded-2xl border border-line bg-panel"
        >
          {/* category-tinted wash along the top edge */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
            style={{ background: `radial-gradient(120% 100% at 0% 0%, ${meta.color}1c, transparent 70%)` }}
          />

          <div className="relative p-5">
            {/* Routing row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-[13px] font-medium"
                style={{ background: `${meta.color}1f`, color: meta.color }}
              >
                <span className="grid size-5 place-items-center rounded-full" style={{ background: `${meta.color}2a` }}>
                  <Icon className="size-3" />
                </span>
                {meta.label}
              </span>
              <span className="flex items-center gap-2 text-[13px]">
                <UrgencyBars urgency={advisory.urgency} scale={0.8} />
                <span style={{ color: urgency.color }} className="font-medium">
                  {urgency.label}
                </span>
              </span>
              <span className="ml-auto flex items-center gap-2.5">
                <span className="text-right leading-tight">
                  <span className="block text-[13px] font-medium">{confidenceBand(advisory.confidence)}</span>
                  <span className="label !text-[9.5px]">confidence</span>
                </span>
                <ConfidenceRing value={advisory.confidence} color={meta.color} size={46} />
              </span>
            </div>

            <h3 className="mt-4 font-display text-[26px] leading-[1.15] tracking-tight text-balance">{f.primary_issue}</h3>

            {isFallback && (
              <Banner tone="red" title="AI service unavailable — safe fallback">
                {advisory.rationale}
              </Banner>
            )}
            {!isFallback && advisory.low_confidence_flag && (
              <Banner tone="amber" title="Tentative routing">
                This could belong to more than one desk. Add detail if it looks off.
              </Banner>
            )}

            {/* Next step */}
            <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-4">
              <div className="label flex items-center gap-1.5 !text-accent">
                <Footprints className="size-3.5" /> Your next step
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{advisory.recommended_action}</p>
            </div>

            {/* Facts */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Fact icon={<CircleDollarSign />} value={f.financial_amount} placeholder="No amount mentioned" />
              <Fact icon={<CalendarClock />} value={f.deadline} placeholder="No deadline mentioned" />
              {f.prior_actions && <Fact icon={<History />} value={f.prior_actions} placeholder="" />}
              {f.entities_involved.length > 0 && <Fact icon={<Users />} value={f.entities_involved.join(' · ')} placeholder="" />}
            </div>
          </div>

          {/* Details */}
          {!isFallback && (
            <div className="relative border-t border-line">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3 text-left text-[13px] text-ink-2 transition-colors hover:text-ink"
                aria-expanded={open}
              >
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="size-4" />
                  {advisory.missing_information.length
                    ? `${advisory.missing_information.length} things to gather · why we routed it`
                    : 'Why we routed it this way'}
                </span>
                <ChevronDown className={clsx('size-4 transition-transform', open && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2">
                      <Checklist key={advisory.request_id} items={advisory.missing_information} />
                      <div>
                        <div className="label mb-2">Reasoning</div>
                        <p className="text-[13px] leading-relaxed text-ink-2">{advisory.rationale}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Follow-ups — only actionable on the newest answer */}
        {latest && advisory.follow_up_questions.length > 0 && <FollowUps questions={advisory.follow_up_questions} />}
      </div>
    </div>
  )
}

function MetaLine({ advisory }: { advisory: AdvisoryResponse }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(advisory, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard unavailable
    }
  }
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="font-medium">Ledgerline</span>
      <span className="font-mono text-[11px] text-ink-3">
        {advisory.model_used} · {(advisory.processing_time_ms / 1000).toFixed(1)}s
      </span>
      <button
        onClick={copy}
        className="ml-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink"
        title="Copy raw JSON"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? 'copied' : 'json'}
      </button>
    </div>
  )
}

function Banner({ tone, title, children }: { tone: 'red' | 'amber'; title: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'mt-4 flex gap-2.5 rounded-xl border p-3.5 text-[13px]',
        tone === 'red' ? 'border-red-500/30 bg-red-500/8' : 'border-amber-500/30 bg-amber-500/8',
      )}
    >
      <AlertTriangle className={clsx('mt-0.5 size-4 shrink-0', tone === 'red' ? 'text-red-400' : 'text-amber-500')} />
      <div>
        <div className={clsx('font-medium', tone === 'red' ? 'text-red-400' : 'text-amber-500')}>{title}</div>
        <div className="mt-0.5 text-ink-2">{children}</div>
      </div>
    </div>
  )
}

function Fact({ icon, value, placeholder }: { icon: ReactNode; value: string | null; placeholder: string }) {
  return (
    <span
      className={clsx(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-panel-2/60 py-1.5 pr-3 pl-2.5 text-[12.5px] [&_svg]:size-3.5 [&_svg]:shrink-0',
        value ? 'text-ink-2' : 'text-ink-3 italic',
      )}
    >
      <span className="text-ink-3">{icon}</span>
      <span className="truncate pr-0.5">{value ?? placeholder}</span>
    </span>
  )
}

function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  if (!items.length) {
    return <p className="text-[13px] text-ink-3">Nothing missing — you gave enough to act on.</p>
  }
  const toggle = (i: number) =>
    setChecked((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  return (
    <div>
      <div className="label mb-2 flex justify-between">
        <span>Gather before you call</span>
        <span className="tabular-nums">
          {checked.size}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((item, i) => (
          <li key={item}>
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1 text-left text-[13px] transition-colors hover:bg-panel-2"
            >
              <span
                className={clsx(
                  'mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-all',
                  checked.has(i) ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong',
                )}
              >
                {checked.has(i) && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className={clsx(checked.has(i) ? 'text-ink-3 line-through' : 'text-ink')}>{item}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FollowUps({ questions }: { questions: string[] }) {
  const insert = useCases((s) => s.insertIntoComposer)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-3"
    >
      <div className="mb-2 text-xs text-ink-3">Answer one to sharpen the advice</div>
      <div className="flex flex-col gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => insert(`Q: ${q}\nA: `)}
            className="group flex items-start gap-2 rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-left text-[13.5px] transition-all hover:border-accent/50 hover:bg-accent-soft"
          >
            <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-ink-3 transition-colors group-hover:text-accent" />
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
