import { useCallback, useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import MapScreen from './screens/MapScreen.jsx'
import CheckOffScreen from './screens/CheckOffScreen.jsx'
import CollectionScreen from './screens/CollectionScreen.jsx'
import FriendsScreen from './screens/FriendsScreen.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import { SPOTS } from './data/spots.js'
import { getMyCheckOffs, getUser, onAuthChange } from './lib/api.js'
import { isDemoMode } from './lib/supabase.js'
import { newThisMonth } from './lib/progress.js'
import { useGeolocation } from './lib/useGeolocation.js'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [tab, setTab] = useState('map')
  const [checkOffs, setCheckOffs] = useState([])
  const [checkOffSpot, setCheckOffSpot] = useState(null)
  const { position, error: gpsError } = useGeolocation()

  useEffect(() => {
    getUser().then((u) => setUser(u ?? null))
    return onAuthChange(setUser)
  }, [])

  const reload = useCallback(() => {
    getMyCheckOffs().then(setCheckOffs)
  }, [])

  useEffect(() => {
    if (user) reload()
  }, [user, reload])

  if (user === undefined) return <div className="screen center">Loading…</div>
  if (!user && !isDemoMode) return <LoginScreen />

  const collectedIds = new Set(checkOffs.map((c) => c.spot_id))
  const monthCount = newThisMonth(checkOffs)

  return (
    <div className="app">
      {isDemoMode && <div className="demo-banner">Demo mode: data is saved only in this browser</div>}
      <main className="app-main">
        {checkOffSpot ? (
          <CheckOffScreen
            spot={checkOffSpot}
            position={position}
            gpsError={gpsError}
            onBack={() => setCheckOffSpot(null)}
            onDone={() => {
              setCheckOffSpot(null)
              reload()
            }}
          />
        ) : tab === 'map' ? (
          <MapScreen
            spots={SPOTS}
            collectedIds={collectedIds}
            position={position}
            newThisMonth={monthCount}
            onCheckOff={setCheckOffSpot}
          />
        ) : tab === 'collection' ? (
          <CollectionScreen spots={SPOTS} checkOffs={checkOffs} collectedIds={collectedIds} newThisMonth={monthCount} />
        ) : (
          <FriendsScreen newThisMonth={monthCount} />
        )}
      </main>
      <NavBar
        active={checkOffSpot ? null : tab}
        onChange={(t) => {
          setCheckOffSpot(null)
          setTab(t)
        }}
      />
    </div>
  )
}
