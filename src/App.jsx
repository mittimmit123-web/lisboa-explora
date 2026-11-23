import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import MapScreen from './screens/MapScreen.jsx'
import CheckOffScreen from './screens/CheckOffScreen.jsx'
import CollectionScreen from './screens/CollectionScreen.jsx'
import FriendsScreen from './screens/FriendsScreen.jsx'
import AddSpotScreen from './screens/AddSpotScreen.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import StoryPopup from './components/StoryPopup.jsx'
import { SPOTS } from './data/spots.js'
import { NEIGHBOURHOODS } from './data/neighbourhoods.js'
import { CHAPTERS } from './data/story.js'
import { getCharacter, getMyCheckOffs, getUser, onAuthChange } from './lib/api.js'
import { isDemoMode } from './lib/supabase.js'
import { neighbourhoodCounts, newThisMonth } from './lib/progress.js'
import { newlyUnlocked, unlockedChapters } from './lib/story.js'
import { hasSeenIntro, markIntroSeen, markWelcomed, welcomeDue } from './lib/intro.js'
import { TOUR_HOST, TOUR_STEPS, hasSeenTour, isLastStep, markTourSeen } from './lib/tour.js'
import { characterById } from './lib/characters.js'
import TourOverlay from './components/TourOverlay.jsx'
import { useGeolocation } from './lib/useGeolocation.js'

// The intro brings the 3D library, so it is only downloaded when it is shown.
const IntroScreen = lazy(() => import('./components/IntroScreen.jsx'))
const WelcomeBack = lazy(() => import('./components/WelcomeBack.jsx'))

export default function App() {
  const [showIntro, setShowIntro] = useState(() => !hasSeenIntro()) // intro (#33)
  const [replayIntro, setReplayIntro] = useState(false) // watched again from the "?" button
  // Later openings: splash with the player's Explora + "welcome back" card
  const [welcome, setWelcome] = useState(() => hasSeenIntro() && Boolean(getCharacter()))
  const [welcomeCard] = useState(() => {
    const due = welcomeDue() // the card only on the first opening of the day
    if (due) markWelcomed()
    return due
  })
  const [tourStep, setTourStep] = useState(null) // guided tour after the intro (#33), null = no tour
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [tab, setTab] = useState('map')
  const [checkOffs, setCheckOffs] = useState([])
  const [checkOffSpot, setCheckOffSpot] = useState(null)
  const [newChapter, setNewChapter] = useState(null) // story pop-up (#32)
  const { position, error: gpsError, blocked: locationBlocked } = useGeolocation()
  // Spots per neighbourhood, for the leaderboard; only recounted when check-offs change
  const myHoodCounts = useMemo(() => neighbourhoodCounts(checkOffs, SPOTS), [checkOffs])
  // All screens share one scroll area: start each new screen at the top.
  const mainRef = useRef(null)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [tab, checkOffSpot])

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

  const finishIntro = useCallback(() => {
    markIntroSeen()
    setShowIntro(false)
    setReplayIntro(false)
    if (!hasSeenTour()) {
      setTourStep(0)
      setTab(TOUR_STEPS[0].tab)
    }
  }, [])

  // The "?" button on the map: watch the intro story or the tour again.
  function watchIntroAgain() {
    setReplayIntro(true)
    setShowIntro(true)
  }
  function showTourAgain() {
    setTourStep(0)
    setTab(TOUR_STEPS[0].tab)
  }

  // Tour: go to the next step (and open its tab), or finish after the last one.
  function finishTour() {
    markTourSeen()
    setTourStep(null)
    setTab('map')
  }
  function nextTourStep() {
    if (isLastStep(tourStep)) return finishTour()
    setTourStep(tourStep + 1)
    setTab(TOUR_STEPS[tourStep + 1].tab)
  }

  // Log in (or sign up) first: the intro saves the player's name.
  if (user === undefined) return <div className="screen center">Loading…</div>
  if (!user && !isDemoMode) return <LoginScreen />

  // First opening after signing up: meet the tram before anything else.
  if (showIntro) {
    return (
      <Suspense fallback={<div className="intro" />}>
        <IntroScreen onDone={finishIntro} replay={replayIntro} />
      </Suspense>
    )
  }

  const collectedIds = new Set(checkOffs.map((c) => c.spot_id))
  const monthCount = newThisMonth(checkOffs)

  return (
    <div className="app">
      {isDemoMode && <div className="demo-banner">Demo mode: data is saved only in this browser</div>}
      <main className="app-main" ref={mainRef}>
        {checkOffSpot ? (
          <CheckOffScreen
            spot={checkOffSpot}
            position={position}
            gpsError={gpsError}
            locationBlocked={locationBlocked}
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
            locationBlocked={locationBlocked}
            onCheckOff={setCheckOffSpot}
            onReplayIntro={watchIntroAgain}
            onReplayTour={showTourAgain}
          />
        ) : tab === 'add' ? (
          <AddSpotScreen spots={SPOTS} collectedIds={collectedIds} position={position} onPick={setCheckOffSpot} />
        ) : tab === 'collection' ? (
          <CollectionScreen spots={SPOTS} checkOffs={checkOffs} collectedIds={collectedIds} />
        ) : (
          <FriendsScreen newThisMonth={monthCount} myHoodCounts={myHoodCounts} />
        )}
      </main>
      {welcome && (
        <Suspense fallback={<div className="welcome-splash" />}>
          <WelcomeBack exploraId={getCharacter()} withCard={welcomeCard} onDone={() => setWelcome(false)} />
        </Suspense>
      )}
      {tourStep !== null && (
        <TourOverlay
          index={tourStep}
          explora={characterById(getCharacter()) ?? characterById(TOUR_HOST)}
          onNext={nextTourStep}
          onSkip={finishTour}
        />
      )}
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
