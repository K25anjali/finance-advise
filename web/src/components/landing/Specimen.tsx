import { useRef } from 'react'
import { useInView } from 'motion/react'
import type { AdvisoryResponse } from '../../lib/types'
import { LedgerEntry } from '../app/LedgerEntry'
import { Receipt } from '../app/Receipt'
import { LinkProvider } from '../app/linking'

const SPECIMEN_NOTE =
  "I can't make payroll this Friday. Two clients owe me $40k combined and they're 60 days late. I have 8 employees and maybe $11,000 in the account."

// A real entry in exactly the shape the API returns, rendered by the app's own components.
const SPECIMEN: AdvisoryResponse = {
  request_id: '0142e7a9-5ce1-4b6f-9d1e-specimen',
  processing_time_ms: 5900,
  model_used: 'claude-haiku-5-5',
  category: 'cash_flow_management',
  confidence: 0.95,
  low_confidence_flag: false,
  extracted_fields: {
    primary_issue: 'Friday payroll for 8 employees is at risk because $40k in receivables is 60 days overdue.',
    financial_amount: '$40,000 owed by two clients; $11,000 on hand',
    deadline: 'This Friday (payroll)',
    entities_involved: ['Two late-paying clients', '8 employees'],
    prior_actions: null,
  },
  urgency: 'critical',
  has_sufficient_info: false,
  missing_information: ['Total payroll due on Friday', 'Whether you have a line of credit'],
  recommended_action:
    'Today, call both clients and ask for payment by Thursday, and take a partial payment if that is what they can do. In parallel, ask your bank about a short-term line of credit, and fund payroll taxes first.',
  rationale:
    'Missing payroll within days harms your employees, so this is critical. The root cause is slow-paying clients, which makes it a cash-flow problem rather than a funding one, even though short-term credit is part of the fix.',
  follow_up_questions: ['What is your total payroll for Friday?', 'Do you already have a business line of credit?'],
  disclaimer: 'Specimen entry. AI-generated triage, not professional financial advice.',
}

/** Shoebox in, ledger out: the receipt, then the entry writing itself once it scrolls into view. */
export function Specimen({ animate = true }: { animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-160px' })
  const show = !animate || inView
  return (
    <LinkProvider>
      <div ref={ref} className="flex flex-col gap-8">
        <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_240px] wide:gap-8">
          <Receipt content={SPECIMEN_NOTE} createdAt="2026-10-22T14:32:00" advisory={show ? SPECIMEN : null} sweep={animate} />
        </div>
        {show ? <LedgerEntry advisory={SPECIMEN} latest={false} fresh={animate} /> : <div className="h-[560px]" />}
      </div>
    </LinkProvider>
  )
}
