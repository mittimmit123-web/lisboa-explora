// Person 2: Check-off (GPS + photo)
import { useEffect, useState } from 'react'
import { checkOff } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import { CHECK_RADIUS_M, distanceMeters, formatDistance } from '../lib/geo.js'
import { categoryById } from '../data/categories.js'
import { shrinkPhoto } from '../lib/photo.js'

export default function CheckOffScreen({ spot, position, gpsError, onDone, onBack }) {
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [pretendHere, setPretendHere] = useState(false) // demo mode only
  const [previewUrl, setPreviewUrl] = useState(null) // temporary link to show the photo

  // Runs when the player takes or picks a photo: shrink it, keep it,
  // and make a temporary link so the <img> below can show it.
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    const smallPhoto = await shrinkPhoto(file)
    setPhoto(smallPhoto)
    setPreviewUrl(URL.createObjectURL(smallPhoto))
    setBusy(false)
  }

  // When the preview link changes or the screen closes, delete the old link to free memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const effectivePosition = pretendHere ? { lat: spot.lat, lng: spot.lng } : position
  const distance = effectivePosition ? distanceMeters(effectivePosition, spot) : null
  // Being close only earns the "verified on site" mark. It never blocks.
  const willVerify = distance !== null && distance <= CHECK_RADIUS_M

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
        </div>

        {isDemoMode && (
          <label className="demo-toggle">
            <input type="checkbox" checked={pretendHere} onChange={(e) => setPretendHere(e.target.checked)} />
            Demo mode: pretend I'm at this spot
          </label>
        )}

        <label className={previewUrl ? 'photo-input has-photo' : 'photo-input'}>
          {previewUrl ? (
            <img src={previewUrl} alt={`Your photo of ${spot.name}`} />
          ) : (
            <span>Take a photo of the spot</span>
          )}
          {/* capture="environment" opens the back camera on phones */}
          <input type="file" accept="image/*" capture="environment" onChange={choosePhoto} />
        </label>
        {photo && <p className="muted">Tap the photo to take a new one</p>}

        {message && <p className="error" role="alert">{message}</p>}

        <button className="primary" disabled={busy || !photo} onClick={submit}>
          {busy ? 'Saving…' : willVerify ? 'Check off' : 'Add to journal'}
        </button>
      </div>
    </div>
  )
}
