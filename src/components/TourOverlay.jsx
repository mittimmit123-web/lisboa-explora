// The guided tour after the intro (issue #33). The chosen Explora pops up and
// explains the app, while a "spotlight" lights up the part it talks about:
// a see-through box over that element with a huge dark shadow around it.
import { lazy, Suspense, useEffect, useState } from 'react'
import { TOUR_STEPS, isLastStep, tourText } from '../lib/tour.js'

const BuddyAvatar = lazy(() => import('./BuddyAvatar.jsx'))

// Where the element with data-tour="..." is on the screen right now.
function measure(target) {
  const el = target && document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

export default function TourOverlay({ index, explora, onNext, onSkip }) {
  const step = TOUR_STEPS[index]
  const [box, setBox] = useState(null)

  // Measure after the tab has switched, and again when the screen size changes.
  useEffect(() => {
    const update = () => setBox(measure(step.target))
    const timer = setTimeout(update, 60)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', update)
    }
  }, [step.target])

  const pad = 6
  const last = isLastStep(index)

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="A quick tour of the app">
      {box ? (
        <div
          className="tour-spotlight"
          style={{ left: box.left - pad, top: box.top - pad, width: box.width + pad * 2, height: box.height + pad * 2 }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      <button className="tour-skip" type="button" onClick={onSkip}>
        Skip tour
      </button>

      <div className="tour-card" key={index}>
        <Suspense fallback={<span className="buddy-avatar buddy-placeholder" aria-hidden="true" />}>
          <BuddyAvatar id={explora.id} />
        </Suspense>
        <div className="tour-talk">
          <span className="tour-name">{explora.name}</span>
          <p aria-live="polite">{tourText(step, explora.name)}</p>
        </div>
        <div className="tour-footer">
          <div className="tour-dots" aria-label={`Step ${index + 1} of ${TOUR_STEPS.length}`}>
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={i === index ? 'on' : undefined} />
            ))}
          </div>
          <button className="tour-next" type="button" onClick={onNext} autoFocus>
            {last ? "Let's go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
