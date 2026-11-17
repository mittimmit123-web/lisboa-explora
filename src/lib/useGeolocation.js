import { useEffect, useState } from 'react'

// Live GPS position of the phone: { position: {lat, lng, accuracy} | null, error }
export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(() =>
    'geolocation' in navigator ? null : 'This browser has no GPS access.',
  )

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy })
        setError(null)
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { position, error }
}
