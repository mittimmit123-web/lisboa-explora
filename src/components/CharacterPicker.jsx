// "Choose your character": the three buddies stand side by side in 3D.
// Tap one (or its button): it slides to the front, grows and spins, the
// other two step back. "Choose" saves it. Loaded only when opened, because
// it brings the 3D library with it.
import { useEffect, useRef, useState } from 'react'
import { CHARACTERS, characterById } from '../lib/characters.js'
import { createPickerStage } from '../lib/pickerStage.js'

export default function CharacterPicker({ current, onChoose, onClose }) {
  const canvasRef = useRef(null)
  const selectedRef = useRef(current)
  const [selected, setSelected] = useState(current)

  function select(id) {
    selectedRef.current = id
    setSelected(id)
  }

  // The 3D stage (tapping, growing, spinning) is shared with the intro.
  useEffect(() => {
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    return createPickerStage(canvasRef.current, { getSelected: () => selectedRef.current, onSelect: select, calm })
  }, [])

  const info = characterById(selected)

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <header className="screen-header row">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Back">
          ‹
        </button>
        <div>
          <h1 id="picker-title">Choose your Explora</h1>
          <p className="muted">Your companion for discovering Lisbon. You can change it later.</p>
        </div>
      </header>

      <canvas ref={canvasRef} className="picker-stage" aria-label="Three characters: tram, sardine and cat. Tap one to see it up close." />

      <div className="picker-tabs" role="group" aria-label="Characters">
        {CHARACTERS.map((c) => (
          <button key={c.id} className="tab" type="button" aria-pressed={selected === c.id} onClick={() => select(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="card picker-info" aria-live="polite">
        {info ? (
          <>
            <h2>{info.name}</h2>
            <p className="muted">
              <strong className="say">“{info.say}”</strong>
              <br />
              {info.about}
            </p>
            <button
              className={current === info.id ? 'primary done' : 'primary'}
              type="button"
              onClick={() => onChoose(info.id)}
            >
              {current === info.id ? `✓ ${info.name} is your Explora` : `Choose ${info.name}`}
            </button>
          </>
        ) : (
          <>
            <h2>Tap a character</h2>
            <p className="muted">Tap one of the three to see it up close.</p>
            <button className="primary" type="button" disabled>
              Choose
            </button>
          </>
        )}
      </div>
    </div>
  )
}
