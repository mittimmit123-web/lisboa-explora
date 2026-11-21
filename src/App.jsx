import { useCallback, useEffect, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import MapScreen from './screens/MapScreen.jsx'
import CheckOffScreen from './screens/CheckOffScreen.jsx'
import CollectionScreen from './screens/CollectionScreen.jsx'
import FriendsScreen from './screens/FriendsScreen.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import StoryPopup from './components/StoryPopup.jsx'
import { SPOTS } from './data/spots.js'
import { NEIGHBOURHOODS } from './data/neighbourhoods.js'
import { CHAPTERS } from './data/story.js'
import { getMyCheckOffs, getUser, onAuthChange } from './lib/api.js'
import { isDemoMode } from './lib/supabase.js'
import { newThisMonth } from './lib/progress.js'
import { newlyUnlocked, unlockedChapters } from './lib/story.js'
import { useGeolocation } from './lib/useGeolocation.js'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [tab, setTab] = useState('map')
  const [checkOffs, setCheckOffs] = useState([])
  const [checkOffSpot, setCheckOffSpot] = useState(null)
  const [newChapter, setNewChapter] = useState(null) // story pop-up (#32)
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
              // Story (#32): did this check-off open a new neighbourhood, and so a new chapter?
              const before = unlockedChapters(checkOffs, SPOTS, NEIGHBOURHOODS, CHAPTERS)
              getMyCheckOffs().then((rows) => {
                setCheckOffs(rows)
                setNewChapter(newlyUnlocked(before, unlockedChapters(rows, SPOTS, NEIGHBOURHOODS, CHAPTERS)))
              })
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
          <CollectionScreen spots={SPOTS} checkOffs={checkOffs} collectedIds={collectedIds} />
        ) : (
          <FriendsScreen newThisMonth={monthCount} />
        )}
      </main>
      {newChapter && (
        <StoryPopup
          entry={newChapter}
          onClose={() => setNewChapter(null)}
          onRead={() => {
            setNewChapter(null)
            setTab('collection')
          }}
        />
      )}
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
