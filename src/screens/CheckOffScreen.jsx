// Person 2: Check-off (GPS + photo)
import { useEffect, useState } from 'react'
import { checkOff } from '../lib/api.js'
import { isDemoMode } from '../lib/supabase.js'
import { CHECK_RADIUS_M, distanceMeters, formatDistance, isGpsWeak } from '../lib/geo.js'
import { categoryById } from '../data/categories.js'
import { checkOffErrorMessage } from '../lib/messages.js'
import { isPhotoTooBig, shrinkPhoto } from '../lib/photo.js'
import { MAX_NOTE_LENGTH, charactersLeft } from '../lib/journal.js'
import StarRating from '../components/StarRating.jsx'

export default function CheckOffScreen({ spot, position, gpsError, onDone, onBack }) {
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false) // true while saving the check-off
  const [preparing, setPreparing] = useState(false) // true while shrinking the photo
  const [message, setMessage] = useState(null)
  const [pretendHere, setPretendHere] = useState(false) // demo mode only
  const [previewUrl, setPreviewUrl] = useState(null) // temporary link to show the photo
  const [note, setNote] = useState('') // optional journal entry
  const [rating, setRating] = useState(null) // optional 1-5, null = no rating

  // Runs when the player takes or picks a photo: shrink it, keep it,
  // and make a temporary link so the <img> below can show it.
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPreparing(true)
    setMessage(null)
    const smallPhoto = await shrinkPhoto(file)
    if (isPhotoTooBig(smallPhoto)) {
      // Shrinking didn't work and the photo is over 5 MB: don't keep it,
      // so the player takes a new one before walking off.
      setPhoto(null)
      setPreviewUrl(null)
      setMessage(checkOffErrorMessage({ reason: 'photo_too_big' }))
    } else {
      setPhoto(smallPhoto)
      setPreviewUrl(URL.createObjectURL(smallPhoto))
    }
    setPreparing(false)
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

  // How exact the phone's GPS is, in metres (only for the real GPS, not "pretend")
  const accuracy = !pretendHere && position?.accuracy != null ? Math.round(position.accuracy) : null

  async function submit() {
    setBusy(true)
    setMessage(null)
    let result
    try {
      result = await checkOff({ spot, position: effectivePosition, photo, note, rating })
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

        <label className={previewUrl ? 'photo-input has-photo' : 'photo-input'}>
          {previewUrl ? (
            <img src={previewUrl} alt={`Your photo of ${spot.name}`} />
          ) : (
            <span>Take a photo of the spot
              <small>optional</small>
            </span>
          )}
          {/* capture="environment" opens the back camera on phones */}
          <input type="file" accept="image/*" capture="environment" onChange={choosePhoto} />
        </label>
        {photo && <p className="muted">Tap the photo to take a new one</p>}

        <label className="journal-note">
          <span className="section-label">Your note</span>
          <textarea
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            rows={3}
            placeholder="What do you want to remember about this place?"
            onChange={(e) => setNote(e.target.value)}
          />
          <small className="muted">{charactersLeft(note)} characters left · optional</small>
        </label>

        <div className="journal-rating">
          <span className="section-label">How was it?</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {message && <p className="error" role="alert">{message}</p>}

        {/* Nothing is required but the spot itself: no photo, no note and no
            rating still makes a valid entry. See DECISIONS.md. */}
        <button className="primary" disabled={busy || preparing} onClick={submit}>
          {preparing ? 'Preparing photo…' : busy ? 'Saving…' : willVerify ? 'Check off' : 'Add to journal'}
        </button>
      </div>
    </div>
  )
}
