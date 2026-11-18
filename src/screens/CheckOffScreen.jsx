// Person 2: Check-off (GPS + photo)
import { useState } from 'react'
import { checkOff } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import { CHECK_RADIUS_M, distanceMeters, formatDistance, isGpsWeak } from '../lib/geo.js'
import { categoryById } from '../data/categories.js'

export default function CheckOffScreen({ spot, position, gpsError, onDone, onBack }) {
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [pretendHere, setPretendHere] = useState(false) // demo mode only

  const effectivePosition = pretendHere ? { lat: spot.lat, lng: spot.lng } : position
  const distance = effectivePosition ? distanceMeters(effectivePosition, spot) : null
  // Being close only earns the "verified on site" mark. It never blocks.
  const willVerify = distance !== null && distance <= CHECK_RADIUS_M

  // How exact the phone's GPS is, in metres (only for the real GPS, not "pretend")
  const accuracy = !pretendHere && position?.accuracy != null ? Math.round(position.accuracy) : null

  async function submit() {
    setBusy(true)
    setMessage(null)
    const result = await checkOff({ spot, position: effectivePosition, photo })
    setBusy(false)
    if (result.ok) {
      onDone()
    } else if (result.reason === 'already_collected') {
      setMessage('You already have this spot.')
    } else {
      setMessage('Something went wrong. Please try again.')
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
        <div className={willVerify ? 'status ok' : 'status'}>
          {gpsError && !pretendHere && <span>GPS: {gpsError}</span>}
          {!gpsError && distance === null && <span>Finding your location…</span>}
          {distance !== null && (
            <span>
              {willVerify
                ? `You're here · ${formatDistance(distance)} · this one gets the "verified on site" mark`
                : `${formatDistance(distance)} away · you can still add it, just without the mark`}
            </span>
          )}
          {/* Own line under the main sentence, in smaller grey text */}
          {accuracy !== null && <span className="gps-accuracy">GPS accurate to {accuracy} m</span>}
        </div>

        {accuracy !== null && isGpsWeak(accuracy) && (
          <p className="gps-warning" role="status">
            Your GPS is not accurate right now (±{accuracy} m), so you might miss the "verified on site" mark. Wait a moment or step outside.
          </p>
        )}

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

        <button className="primary" disabled={busy || !photo} onClick={submit}>
          {busy ? 'Saving…' : willVerify ? 'Check off' : 'Add to journal'}
        </button>
      </div>
    </div>
  )
}
