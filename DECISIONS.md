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

Below zoom 15, only spots marked `highlight` are drawn; above it, everything
inside the visible part of the map.

**Why.** 1,930 markers at once is unusable and slow. The highlights are ten
per category - five well-known ones so you can orient yourself, and five
lesser-known ones, at most one per neighbourhood so they are spread across
the city rather than piled up in the centre.

**Accepted limit.** In the dense centre, zoom 15 still draws over 500 markers
at once, which stutters on a phone. Raising `SHOW_ALL_ZOOM` from 15 to 16
halves that and is a one-line change; we have not made it yet.
