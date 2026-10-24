import type { ReactNode } from 'react'
import { EXAMPLES } from '../../lib/meta'
import type { CaseContext } from '../../lib/types'

// The prompt-injection example is for testing the API, not for owners.
const SPECIMENS = EXAMPLES.filter((e) => e.tag !== 'Prompt injection')

/** New-case screen: the composer centred under one question, with specimen notes to start from. */
export function Welcome({ onPick, children }: { onPick: (text: string, context?: CaseContext) => void; children: ReactNode }) {
  return (
    <div className="dk-empty">
      <div className="dk-empty__col">
        <h1 className="dk-empty__title">What’s in the shoebox?</h1>
        {children}
        <section className="dk-specimens" aria-labelledby="specimens-label">
          <h2 id="specimens-label" className="dk-specimens__label" style={{ margin: 0 }}>
            Or start from a specimen
          </h2>
          {SPECIMENS.map((ex) => (
            <button key={ex.tag} type="button" className="dk-specimen" onClick={() => onPick(ex.text, ex.context)}>
              <span className="dk-specimen__tag">{ex.tag}</span>
              <span className="dk-specimen__text">{ex.text}</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  )
}
