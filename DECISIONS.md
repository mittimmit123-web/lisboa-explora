# Decisions

Why Lisboa Explora is built the way it is. Each entry says what we decided,
why, and what we knowingly gave up. We wrote this down as we went, so that
any of us can explain any part of the project, not only the part we wrote.

## 1. A check-off is never refused because of distance

Being within 50 m of a spot only earns a "verified on site" mark. The spot
always goes into the player's journal.

**Why.** The app is a travel diary first and a game second. Our first version
refused the check-off when GPS said you were too far away, and that broke the
honest cases: adding a spot a few days later, GPS being wrong between tall
buildings in Alfama, or a phone that reports a 200 m accuracy indoors. Losing
a real memory to a bad GPS reading is worse than letting someone cheat.

**Accepted limit.** Somebody can add a spot they never visited. We decided
that an unverified entry is still worth having, and the mark is what carries
the proof.

## 2. The server decides the "verified" mark, not the browser

`public.check_off` in `supabase/schema.sql` measures the distance itself and
sets the flag. The browser sends only its raw position. The copy of the
formula in `src/lib/geo.js` is used for showing "320 m away".

**Why.** Anything the browser sends can be changed by the person using it.
If the browser decided the flag, the mark would mean nothing.

**Accepted limit.** The distance is computed twice, in two languages, and the
two could drift apart. Both use the same haversine formula, and `geo.js` says
so in a comment.

## 3. The leaderboard counts every check-off, verified or not

**Why.** It is a friendly comparison between friends, not a competition. If
only verified check-offs counted, the GPS problems from decision 1 would come
back through the side door.

## 4. Spots come from OpenStreetMap, not from a hand-picked list

`scripts/import-osm.mjs` downloads places once and writes `src/data/spots.js`.
We started with 21 spots chosen by hand and now have about 1,930.

**Why.** Hand-picking is slow, and four students picking their own favourites
would have produced a list of the same tourist sights everyone already knows.
The whole idea is discovering places you have not seen.

**Accepted limit.** OpenStreetMap data is written by volunteers, so some
entries are thin or oddly tagged. The filter rules in `src/lib/osmFilter.js`
remove the worst cases, and we accept that a few uninteresting places slip
through. OpenStreetMap data is licensed under the ODbL and is credited in the
generated file and on the map.

## 5. A spot's id is the OpenStreetMap object, not its name

Ids look like `osm-n123` or `osm-w45`.

**Why.** Names change. If a volunteer renames a place in OpenStreetMap and
the id were built from the name, every player who collected that spot would
lose it, because `check_offs.spot_id` points at the id.

**Accepted limit.** If a place is deleted and re-created in OpenStreetMap it
gets a new id and counts as a new spot. That is rare and we can live with it.

## 6. The spot list ships inside the app and lives in the database

The same spots are in `src/data/spots.js` and in `public.spots`.

**Why.** The app reads the list it ships with, so the map works instantly and
does not depend on a database round trip. The database copy exists because
`check_offs.spot_id` needs something to point at, and because the server has
to look up a spot's position to measure the distance for decision 2.

**Accepted limit.** The bundle is about 670 kB, and the two copies can drift
apart if someone re-runs the import without re-running the seed. `npm run
import-osm && npm run seed` is one command for a reason.

## 7. Players can read their own rows; all writing goes through functions

Row Level Security is on for all four tables. There are only `select`
policies. Inserts and updates happen in `security definer` functions that
check the rules themselves.

**Why.** It means a leaked key cannot be used to write anything. The rules
that matter - one check-off per spot, photos only in your own folder, the
verified mark - are enforced in one place that the client cannot reach.

**Accepted limit.** Every new feature that writes data needs a new function.
That is slower to write, and deliberately so.

## 8. The publishable key is not a secret

`VITE_SUPABASE_ANON_KEY` is compiled into the JavaScript we ship. Anyone can
read it.

**Why.** That is how Supabase is designed. The key only says which project to
talk to; decision 7 is what protects the data. The `service_role` key, which
does bypass Row Level Security, is in no file, no environment variable of
ours and no chat.

## 9. Only the exact production domain is an allowed redirect URL

Supabase accepts `http://localhost:5173/**` and
`https://lisboa-explora.vercel.app/**`, and nothing else.

**Why.** A wildcard such as `https://*.vercel.app/**` would have let the
preview deployments of our pull requests log in too. It would also hand a
login token to any site anyone deploys on `vercel.app`.
`https://lisboa-explora-*.vercel.app/**` is no better: Vercel preview domains
are `project-hash-scope.vercel.app`, so a stranger's project named
`lisboa-explora-test` matches it.

**Accepted limit.** You cannot log in on a pull request preview. We test
logins on the live site or on localhost.

## 10. Without keys, the app runs in demo mode

If there is no `.env`, `src/lib/supabase.js` exports `null` and the data
layer keeps everything in `localStorage`.

**Why.** A teammate can clone the repository and see a working app in two
commands, without an account or a key. It also means the person marking this
project can run it.

**Accepted limit.** Demo mode has fake friends and loses data when the
browser storage is cleared.

## 11. Dependencies are pinned to exact versions

No `^` in `package.json`.

**Why.** With a caret, two of us can install different versions of the same
library from the same repository, and the build that passes on a laptop can
fail on Vercel. Pinning makes the install reproducible.

**Accepted limit.** Security updates do not arrive on their own. For a
project with a deadline in days, we prefer knowing exactly what we ship.

## 12. Every pull request runs the tests and a production build

`.github/workflows/tests.yml`.

**Why.** Four people merging in parallel, and nobody has to remember to run
`npm test`. The build runs too, because Vercel builds `main` after every
merge and a broken build is cheaper to find before the merge than after.

## 13. Zoomed out, the map shows only highlights

Below zoom 16, only spots marked `highlight` are drawn; from 16 on, everything
inside the visible part of the map (plus a 5 % margin, so panning looks smooth).

**Why.** 1,930 markers at once is unusable and slow. The highlights are ten
per category - five well-known ones so you can orient yourself, and five
lesser-known ones, at most one per neighbourhood so they are spread across
the city rather than piled up in the centre.

**Changed in #40.** This used to start at zoom 15 with a 20 % margin, which
drew about 680 markers at once on a phone in the city centre, and zooming
stuttered. Zoom 16 and a 5 % margin bring that down to about 200. We
considered marker clusters (bubbles with a number) as well; they would be
faster still, but need an extra library and change the look of the map.

**Smooth zooming (#40).** Leaflet's own trackpad / mouse-wheel zoom works in
steps and ignores scrolling while a step's animation plays, so it felt slow
and laggy. `src/lib/smoothWheelZoom.js` replaces it: the map follows the
scrolling directly, like Google Maps. We wrote it ourselves (same idea as the
Leaflet.SmoothWheelZoom plugin) rather than add a little-maintained library.
Markers are also memoised, so a new GPS position does not redraw all of them.
The zoom maths (how far one scroll zooms, the glide, when a zoom is over)
is in `src/lib/zoomMath.js`, separate from Leaflet, so `tests/zoomMath.test.js`
can check it, including the smallest and largest zoom.

**An empty map explains itself.** When the filters or the visible part of the
map leave no spots, a short hint says why (for example "You haven't collected
any spots yet"), so an empty map never looks broken.

## 14. Our own map design (vector map)

The map background is painted by MapLibre in our own colours ("Lisboa warm":
cream background, white roads, soft green parks, light blue water), defined
in `src/lib/mapStyle.js`. The data comes from OpenFreeMap: OpenStreetMap
data, free, with no account and no API key. Markers, filters and zooming
are unchanged, because MapLibre runs as a layer inside the Leaflet map.

**Why.** The standard OpenStreetMap map is busy: its own icons for churches
and restaurants compete with our markers. Image-based maps cannot be
recoloured; a vector map can. CARTO and Stadia have calm styles too, but now
need an account and an API key.

**Accepted limit.** The first load is about 440 KB larger (MapLibre 6 and its
worker, gzipped): barely noticeable on Wi-Fi, a few seconds on a weak
connection; afterwards the browser has it cached. We use MapLibre 6, not the
smaller 5, because 5 has a known critical security issue. If the new map
causes problems, e.g. on a very old phone, `USE_OWN_MAP_DESIGN = false` in
`src/screens/MapScreen.jsx` switches back to the classic map.

## 15. Every neighbourhood has its own colour on the map

Lisbon's 24 parishes are drawn as soft, see-through colour areas under the
markers. Where the player has collected at least one spot, the colour is
stronger; everywhere else it is very light, a hint of what is left to
discover. Colours are in `src/data/neighbourhoodColors.js`, borders in
`src/data/parishes.js`.

**Why.** It makes the player's "territory" visible at a glance and fits the
neighbourhood leaderboard. We tried one colour for everything, one colour
getting darker with more spots, and grey for locked areas; 24 pastels where
locked areas are only lighter (not grey) looked the most like a map you want
to fill in.

**How the colours were chosen.** Same lightness and saturation for all, 24
hues spread around the colour wheel. They are shared out so that two
neighbourhoods that touch differ by at least 75 degrees of hue (pink next to
green, never pink next to pink); a test checks this for all 54 borders.

**Accepted limit.** The borders come from OpenStreetMap, downloaded once with
`npm run import-parishes` (same idea as decision 4). The file is about 13 KB
gzipped and is loaded only after the map is on screen, so the first start is
not slower. The areas lie on top of the street names, so they are never
solid. `SHOW_NEIGHBOURHOOD_COLOURS = false` in `src/screens/MapScreen.jsx`
turns them off.

## 16. The story unlocks by neighbourhood, not by number of spots

Every new neighbourhood unlocks the next of 24 chapters (Lisbon has 24
parishes), in the order the player visits them. The first photo taken there
becomes a postcard for the Explora's album, with the chapter on the back.
Logic in `src/lib/story.js`, texts in `src/data/story.js`.

**Why.** We want players to explore the whole city, not collect ten cafés on
their own street. A fixed chapter order means the story always makes sense,
whichever neighbourhood a player starts in; the neighbourhood's name is filled
into the text.

**Accepted limit.** The chapters cannot tell something specific about each
place, because any chapter can belong to any neighbourhood. After 24
neighbourhoods the story ends.

**Could change.** One chapter written for each neighbourhood, or new stories
for other cities.

## 17. Every neighbourhood has one real fact

Each of the 24 neighbourhoods has one short, true fact (`src/data/facts.js`),
shown as "💡 Did you know?" with the story chapter and on the back of its
postcard.

**Why.** The story chapters can belong to any neighbourhood (decision 16), so
they cannot say much about the place itself. The fact is the part that is
really about that neighbourhood, so players learn something real about where
they have been.

**Accepted limit.** We wrote and checked the facts ourselves, so one could be
wrong or become outdated. There is only one fact per neighbourhood, so it
never changes.

**Could change.** Several facts per neighbourhood that rotate, or a link to a
source for each fact.

## 18. The player's Explora is saved on the phone, not on the server

The chosen Explora (Trammy, Captain Bubbles or Miss Purrfect) is stored in the
browser's `localStorage` (`getCharacter` / `setCharacter` in
`src/lib/api.js`).

**Why.** It is only decoration, not personal data. It needs no database change
and works the same in demo mode.

**Accepted limit.** On a new phone or browser the player chooses again, and
friends cannot see each other's Explora.

**Could change.** A column in `profiles`, so the Explora follows the account
and can appear on the leaderboard.

## 19. The 3D models only load when they are needed

The 3D library (three.js) is downloaded only when the intro or an Explora is
shown, for example in the Collection card or the weather square (`React.lazy`
in `src/App.jsx` and the components that show an Explora). Until then a
placeholder is shown.

**Why.** three.js is large. The map must open quickly on mobile data in the
street.

**Accepted limit.** The first time a 3D scene appears there is a short wait,
and very old phones may struggle.

**Could change.** Simpler 2D pictures as a fallback for slow phones.

## 20. Friends must accept a request, and "sent" is always the answer

Adding a friend sends a request; the other player accepts or denies it.
`add_friend` in `supabase/schema.sql` always answers "sent", even for an email
that does not exist.

**Why.** Before, typing someone's email made you friends at once, so a
stranger could see your spots (weak spot 3 in `docs/security-check.md`).
Always answering "sent" means nobody can use the app to find out which emails
play.

**Accepted limit.** A mistyped email is not reported. Denying is silent, so
the sender never learns why nothing happens.

**Could change.** Invite links or QR codes instead of typing an email.

## 21. Crowns are worked out in the app, among you and your friends

The server sends how many spots each player has in each neighbourhood
(`friends_leaderboard`). The app decides who is "👑 Ruler": the most spots
there, and a tie means nobody (`withTitles` in `src/lib/friends.js`). The
leaderboard shows only a player's strongest crown.

**Why.** It is a friendly title, not a score that needs protecting: the server
already checks every check-off, and the crown is only computed from those
counts. Showing one crown keeps the leaderboard short.

**Accepted limit.** "Ruler" depends on the friend group, so two people can
both be "Ruler of Belém" in different groups. A player can lead in many
neighbourhoods, but only the best one is shown.

**Could change.** A minimum number of spots for a crown, or crowns computed on
the server for everyone.

## 22. The Friends screen shows weather instead of just a rank

The player's Explora stands in weather that matches their rank among their
friends this month: golden sun when leading by 2 or more, clouds when it is
close, wind or drizzle when behind, rain with 0 spots (`weatherMood` in
`src/lib/friends.js`).

**Why.** A friendly race should motivate, not shame. The weather shows at a
glance how you are doing, and the text always says what would make it better
("One more spot and the sun breaks through").

**Accepted limit.** It is less exact than a number, so the exact counts are in
the leaderboard below it.

**Could change.** Weather for the neighbourhoods leaderboard too.

## 23. The intro plays once; the "?" button brings it back

The intro and the tour play only the first time (remembered in the browser).
The "?" on the map replays them; the replay skips choosing an Explora and the
name (`REPLAY_STEPS` in `src/lib/intro.js`). The "welcome back" card shows at
most once a day.

**Why.** New players need to understand the game, but returning players should
not be blocked by it.

**Accepted limit.** On a new phone or browser the intro plays again.

**Could change.** Saving "intro seen" with the account instead of the browser.
