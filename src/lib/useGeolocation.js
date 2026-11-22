import { useEffect, useState } from 'react'

import { isLocationBlocked } from './location.js'

// Live GPS position of the phone:
// { position: {lat, lng, accuracy} | null, error, blocked }
// blocked = true when the player or a setting has turned location off for this website.
export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState(() =>
    'geolocation' in navigator ? null : 'This browser has no GPS access.',
  )

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy })
        setError(null)
        setBlocked(false)
      },
      (e) => {
        setError(e.message)
        setBlocked(isLocationBlocked(e.code))
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { position, error, blocked }
}
