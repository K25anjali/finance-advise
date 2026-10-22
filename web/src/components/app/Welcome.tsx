import { useState, type ReactNode } from 'react'
import { EXAMPLES } from '../../lib/meta'
import { proseDate } from '../../lib/ledger'
import type { CaseContext } from '../../lib/types'

// The prompt-injection example is for testing the API, not for owners.
const SPECIMENS = EXAMPLES.filter((e) => e.tag !== 'Prompt injection')

/** New-case screen: a blank intake slip, with a few specimen notes to start from. */
export function Welcome({ onPick, children }: { onPick: (text: string, context?: CaseContext) => void; children: ReactNode }) {
  const [today] = useState(() => proseDate(new Date().toISOString()))
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pt-[8vh] pb-16">
      <p className="t-label">New case · {today}</p>
      <h1 className="t-h1 mt-2 sm:text-[32px] sm:leading-[40px]">What's in the shoebox?</h1>
      <p className="mt-2 max-w-[56ch] text-graphite">
        Describe the money problem in your own words: amounts, dates, who's involved, what you've tried. Rough is fine. Sorting it
        is our job.
      </p>

      <div className="mt-8">{children}</div>

      <section className="mt-12">
        <h2 className="t-label border-b border-rule-strong pb-1">Or start from a specimen</h2>
        <ul>
          {SPECIMENS.map((ex) => (
            <li key={ex.tag} className="border-b border-rule">
              <button
                onClick={() => onPick(ex.text, ex.context)}
                className="group grid w-full grid-cols-[112px_minmax(0,1fr)] gap-3 py-2 text-left sm:grid-cols-[144px_minmax(0,1fr)]"
              >
                <span className="t-label pt-0.5 group-hover:text-ink">{ex.tag}</span>
                <span className="t-sm truncate text-graphite group-hover:text-ink">{ex.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
