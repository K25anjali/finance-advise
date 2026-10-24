import { accountLabel } from './meta'
import type { AdvisoryResponse } from './types'

export type FactField = 'financial_amount' | 'deadline' | 'entities_involved' | 'prior_actions'

/** Fact rows in reading order, with the label the assistant uses for each. */
export const FACT_LABELS: { key: FactField; label: string }[] = [
  { key: 'financial_amount', label: 'Amount' },
  { key: 'deadline', label: 'Due' },
  { key: 'entities_involved', label: 'Who’s involved' },
  { key: 'prior_actions', label: 'Done so far' },
]

/** The facts we could pick out; a missing one is simply absent. */
export function factsOf(a: AdvisoryResponse): { key: FactField; label: string; value: string }[] {
  const f = a.extracted_fields
  const values: Record<FactField, string | null> = {
    financial_amount: f.financial_amount,
    deadline: f.deadline,
    entities_involved: f.entities_involved.length ? f.entities_involved.join(', ') : null,
    prior_actions: f.prior_actions,
  }
  return FACT_LABELS.filter((r) => values[r.key]).map((r) => ({ ...r, value: values[r.key]! }))
}

/** Short entry reference from the request id: #972F22. */
export const entryRef = (a: AdvisoryResponse) => a.request_id.replace(/-/g, '').slice(0, 6).toUpperCase()

/** The entry as plain text, for copy, export and share. */
export function entryToText(a: AdvisoryResponse) {
  const lines = [
    `${accountLabel(a.category)}  [${a.urgency.toUpperCase()}]  #${entryRef(a)}`,
    a.extracted_fields.primary_issue,
    '',
    ...factsOf(a).map((r) => `${r.label}: ${r.value}`),
    '',
    `Working: ${a.rationale}`,
    '',
    '═'.repeat(40),
    `Bottom line: ${a.recommended_action}`,
  ]
  if (a.missing_information.length) lines.push('', 'Still needed:', ...a.missing_information.map((m) => `  · ${m}`))
  if (a.follow_up_questions.length) lines.push('', 'Questions for you:', ...a.follow_up_questions.map((q, i) => `  ${i + 1}. ${q}`))
  lines.push('', a.disclaimer)
  return lines.join('\n')
}
