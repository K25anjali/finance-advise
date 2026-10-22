import type { ExtractedFields } from './types'

/** Small stable hash, so anything "hand-made" (stamp angle, ink grain) is the same on every render. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Stamp rotation in −3°…+3° and an ink-grain offset, seeded from the request ID (design.md §6.6). */
export function stampSeed(id: string) {
  const h = hash(id)
  const rot = ((h % 601) / 100 - 3).toFixed(2)
  return { rot: `${rot}deg`, grain: `${(h >> 8) % 160}px ${(h >> 16) % 160}px` }
}

/** Human case reference from a uuid hex id: C-1A2B. */
export const caseRef = (id: string) => `C-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')

/** Prose date: 14 Nov 2026. */
export const proseDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Machine print: RECEIVED 14:32 · 22 OCT 2026. */
export const machineStamp = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`
}

/** Ledger period heading: OCTOBER 2026. */
export const periodOf = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

// ── Fact → source span matching ───────────────────────────────────────────
// Fallback for design.md §12 until the API returns `source_spans`: find each extracted fact in the
// owner's own words. A fact we can't place is simply not highlighted.

export type FactKey = 'financial_amount' | 'deadline' | 'entities_involved'

/** Fact rows in ledger order, with their column labels. */
export const FACT_ROWS: { key: FactKey | 'prior_actions'; label: string }[] = [
  { key: 'financial_amount', label: 'Amount' },
  { key: 'deadline', label: 'Due' },
  { key: 'entities_involved', label: 'Parties' },
  { key: 'prior_actions', label: 'Done so far' },
]

/** Result choreography (design.md §8): rows write in 40ms apart; highlights sweep in step with their row. */
export const rowDelay = (i: number) => 160 + i * 40
export const factDelay = (fact: FactKey) => rowDelay(FACT_ROWS.findIndex((r) => r.key === fact))

export interface Span {
  start: number
  end: number
  fact: FactKey
}

const MONEY = /\$\s?\d[\d,]*(?:\.\d+)?\s?(?:k|K|m|M|million|thousand)?\b/g

function moneyValue(token: string): number | null {
  const m = token.replace(/[$,\s]/g, '').match(/^(\d+(?:\.\d+)?)(k|m|million|thousand)?$/i)
  if (!m) return null
  const unit = m[2]?.toLowerCase()
  const mult = unit === 'k' || unit === 'thousand' ? 1e3 : unit === 'm' || unit === 'million' ? 1e6 : 1
  return parseFloat(m[1]) * mult
}

const TIME_WORDS =
  /\b(?:today|tonight|tomorrow|this (?:week|month|friday|monday|tuesday|wednesday|thursday)|next (?:week|month)|end of (?:the )?(?:week|month|year)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)? (?:of )?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|(?:in )?(?:\d+|a|one|two|three|four|five|six) (?:days?|weeks?|months?))\b/gi

// Capitalised only because they open the phrase: "Two late-paying clients", "Former accountant".
const STOP = new Set(['a', 'an', 'the', 'my', 'our', 'your', 'their', 'his', 'her', 'one', 'two', 'three', 'four', 'five', 'several', 'some', 'former', 'previous', 'new', 'current', 'local', 'business'])

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function findAll(text: string, needle: string): [number, number][] {
  if (needle.trim().length < 2) return []
  const re = new RegExp(`\\b${escape(needle)}\\b`, 'gi')
  return [...text.matchAll(re)].map((m) => [m.index!, m.index! + m[0].length])
}

export function findFactSpans(text: string, f: ExtractedFields): Span[] {
  const spans: Span[] = []

  if (f.financial_amount) {
    const wanted = [...f.financial_amount.matchAll(MONEY)].map((m) => moneyValue(m[0])).filter((v): v is number => v != null)
    for (const m of text.matchAll(MONEY)) {
      const v = moneyValue(m[0].trim())
      if (v != null && wanted.includes(v)) spans.push({ start: m.index!, end: m.index! + m[0].trimEnd().length, fact: 'financial_amount' })
    }
  }

  if (f.deadline) {
    const words = new Set([...f.deadline.matchAll(TIME_WORDS)].map((m) => m[0].toLowerCase().replace(/^in /, '')))
    for (const m of text.matchAll(TIME_WORDS)) {
      const w = m[0].toLowerCase().replace(/^in /, '')
      if ([...words].some((x) => x === w || x.includes(w) || w.includes(x))) {
        const lead = m[0].toLowerCase().startsWith('in ') ? 3 : 0
        spans.push({ start: m.index! + lead, end: m.index! + m[0].length, fact: 'deadline' })
      }
    }
  }

  for (const entity of f.entities_involved) {
    let hits = findAll(text, entity)
    if (!hits.length) {
      // "Two late-paying clients" → try its distinctive words: acronyms, Capitalised names, "8 employees".
      const parts = entity.match(/\b(?:[A-Z]{2,}|[A-Z][a-z]+(?: [A-Z][a-z]+)*|\d+ [a-z]+)\b/g) ?? []
      hits = parts.filter((p) => !STOP.has(p.toLowerCase())).flatMap((p) => findAll(text, p))
    }
    for (const [start, end] of hits) spans.push({ start, end, fact: 'entities_involved' })
  }

  // Earliest wins on overlap.
  spans.sort((a, b) => a.start - b.start || b.end - a.end)
  return spans.filter((s, i) => i === 0 || s.start >= spans.slice(0, i).reduce((e, p) => Math.max(e, p.end), 0))
}

/** Replies to a follow-up are stored as "> question" + blank line + answer. */
export function splitQuote(content: string): { quote: string | null; body: string } {
  const m = content.match(/^> (.+)\n\n([\s\S]*)$/)
  return m ? { quote: m[1], body: m[2] } : { quote: null, body: content }
}

/** Links a fact row to its highlight in the receipt: `${request_id}:${fact}` (design.md §6.5). */
export const linkKey = (requestId: string, fact: FactKey) => `${requestId}:${fact}`
export const spanId = (requestId: string, fact: FactKey) => `src-${requestId}-${fact}`
