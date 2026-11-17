// Person 2: Check-off (GPS + photo)
import { useState } from 'react'
import { checkOff } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import { CHECK_RADIUS_M, distanceMeters, formatDistance } from '../lib/geo.js'
import { categoryById } from '../data/categories.js'
import { checkOffErrorMessage } from '../lib/messages.js'

export default function CheckOffScreen({ spot, position, gpsError, onDone, onBack }) {
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [pretendHere, setPretendHere] = useState(false) // demo mode only

  const effectivePosition = pretendHere ? { lat: spot.lat, lng: spot.lng } : position
  const distance = effectivePosition ? distanceMeters(effectivePosition, spot) : null
  const closeEnough = distance !== null && distance <= CHECK_RADIUS_M

  async function submit() {
    setBusy(true)
    setMessage(null)
    let result
    try {
      result = await checkOff({ spot, position: effectivePosition, photo })
    } catch {
      // e.g. the internet dropped completely: treat it like a server problem
      result = { ok: false, reason: 'server_error' }
    }
    setBusy(false)
    if (result.ok) {
      onDone()
    } else {
      setMessage(checkOffErrorMessage(result))
    }
  }

  return (
    <div className="screen">
      <header className="screen-header row">
        <button className="icon-btn" aria-label="Back to map" onClick={onBack}>
          ‹
        </button>
        <div>
          <p className="eyebrow" style={{ color: categoryById(spot.category)?.color }}>
            {categoryById(spot.category)?.label}
          </p>
          <h1>{spot.name}</h1>
        </div>
      </header>

      <div className="content">
        <div className={closeEnough ? 'status ok' : 'status'}>
          {gpsError && !pretendHere && <span>GPS: {gpsError}</span>}
          {!gpsError && distance === null && <span>Finding your location…</span>}
          {distance !== null && (
            <span>
              {closeEnough ? "You're here" : 'Too far away'} · {formatDistance(distance)}
              {' '}(needs {CHECK_RADIUS_M} m)
            </span>
          )}
        </div>

        {isDemoMode && (
          <label className="demo-toggle">
            <input type="checkbox" checked={pretendHere} onChange={(e) => setPretendHere(e.target.checked)} />
            Demo mode: pretend I'm at this spot
          </label>
        )}

        <label className="photo-input">
          <span>{photo ? `Photo: ${photo.name}` : 'Take a photo of the spot'}</span>
          {/* capture="environment" opens the back camera on phones */}
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>

        {message && <p className="error" role="alert">{message}</p>}

        <button className="primary" disabled={busy || !photo || !closeEnough} onClick={submit}>
          {busy ? 'Checking…' : 'Check off'}
        </button>
      </div>
    </div>
  )
}
