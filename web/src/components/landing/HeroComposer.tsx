import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { saveDraft } from '../../lib/draft'
import { EXAMPLES } from '../../lib/meta'
import { useAuth } from '../../store/useAuth'
import { Staple } from '../ui'

/** The landing page's intake slip. Whatever is typed here is waiting in the app after sign-up. */
export function HeroComposer() {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const authed = useAuth((s) => s.status) === 'authed'
  const navigate = useNavigate()

  const go = () => {
    const text = value.trim()
    if (text) saveDraft(text)
    navigate(authed ? '/app' : '/signup')
  }

  return (
    <div className="w-full">
      <div className="paper-shadow">
        <div className="receipt torn-top px-4 pb-3 sm:px-5">
          <div className="t-machine text-graphite">INTAKE · NEW CASE</div>
          <textarea
            ref={ref}
            value={value}
            rows={4}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                go()
              }
            }}
            placeholder="Tell it the way you'd tell your accountant. Dump it all in; we'll sort it."
            aria-label="Describe your money problem"
            className="mt-2 block w-full resize-none bg-transparent text-ink outline-none placeholder:text-pencil"
          />
          <div className="mt-3 flex items-center gap-3 border-t border-dashed border-rule-strong pt-3">
            <span className="t-fine inline-flex items-center gap-1.5">
              <Staple className="h-3 w-4" /> Notices and statements can be stapled on inside.
            </span>
            <button onClick={go} className="btn btn-primary ml-auto shrink-0">
              Sort this out
            </button>
          </div>
        </div>
      </div>

      <div className="t-sm mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="t-label">Try</span>
        {EXAMPLES.slice(0, 4).map((ex) => (
          <button
            key={ex.tag}
            onClick={() => {
              setValue(ex.text)
              ref.current?.focus()
            }}
            className="text-carbon underline decoration-carbon/40 underline-offset-3 hover:decoration-carbon"
          >
            {ex.tag}
          </button>
        ))}
      </div>
    </div>
  )
}
