// The round "?" button at the top right of the map. It opens a small menu to
// watch the intro story or the app tour again. Tapping outside closes it.
import { useEffect, useRef, useState } from 'react'

export default function HelpMenu({ onIntro, onTour }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close the menu on a tap outside it, or with the Escape key.
  useEffect(() => {
    if (!open) return
    const onTap = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onTap)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onTap)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(action) {
    setOpen(false)
    action()
  }

  return (
    <div className="help" ref={ref}>
      <button
        className="help-btn"
        type="button"
        aria-label="Help"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ?
      </button>
      {open && (
        <div className="help-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => choose(onIntro)}>
            ▶&nbsp; Rewatch the intro
          </button>
          <button type="button" role="menuitem" onClick={() => choose(onTour)}>
            🧭&nbsp; Show me the app
          </button>
        </div>
      )}
    </div>
  )
}
