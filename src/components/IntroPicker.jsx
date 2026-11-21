// Intro step 2 (issue #33): choose your buddy for the first time.
// Same 3D stage as the picker in Collection (src/lib/pickerStage.js), on the
// intro's purple background. The choice is saved with setCharacter and can be
// changed later in Collection.
import { useEffect, useRef, useState } from 'react'
import { setCharacter } from '../lib/api.js'
import { CHARACTERS, characterById } from '../lib/characters.js'
import { createPickerStage } from '../lib/pickerStage.js'

export default function IntroPicker({ onDone }) {
  const canvasRef = useRef(null)
  const selectedRef = useRef(null)
  const [selected, setSelected] = useState(null)

  function select(id) {
    selectedRef.current = id
    setSelected(id)
  }

  useEffect(() => {
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    return createPickerStage(canvasRef.current, {
      getSelected: () => selectedRef.current,
      onSelect: select,
      floor: 'shadow',
      calm,
      lookAtY: 2.9, // characters a bit lower, so the speech bubble fits above them
    })
  }, [])

  const buddy = characterById(selected)

  function choose() {
    setCharacter(buddy.id)
    onDone()
  }

  return (
    <div className="intro-pick">
      <h1 className="intro-pick-title">
        Who will explore
        <br />
        Lisbon with you?
      </h1>
      <canvas ref={canvasRef} className="intro-pick-stage" aria-label="Tram, sardine and cat. Tap one to choose." />
      {buddy ? (
        <p key={buddy.id} className="intro-bubble intro-bubble-pick" aria-live="polite">
          {buddy.say}
        </p>
      ) : (
        <p className="intro-pick-hint">Tap a character to meet it</p>
      )}

      <div className="intro-pick-bottom">
        <div className="intro-pick-tabs" role="group" aria-label="Characters">
          {CHARACTERS.map((c) => (
            <button key={c.id} type="button" className="intro-tab" aria-pressed={selected === c.id} onClick={() => select(c.id)}>
              <span className="tab-emoji" aria-hidden="true">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <button className="intro-choose" type="button" disabled={!buddy} onClick={choose}>
          Choose your Explora
        </button>
        <button className="intro-later" type="button" onClick={onDone}>
          Choose later
        </button>
      </div>
    </div>
  )
}
