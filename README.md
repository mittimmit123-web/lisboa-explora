# Lisboa Explora

**Collect Lisbon, one spot at a time.** Visit real places in Lisbon — viewpoints,
parks, churches, bars, food spots — check them off where you are standing, build a
collection with photos and notes, and compare it with your friends every month.

Team project for *Introduction to Programming* (Nova SBE, 2026/27).

**Live app:** https://lisboa-explora.vercel.app — best opened on a phone, see
[Open it on your phone](#open-it-on-your-phone). No installation, no keys.

## What we set out to build

Most people who live in Lisbon know their own neighbourhood and three streets in
Baixa. The goal of this project was to build something that gets a person to walk
into the other twenty-three parishes of the city, and to make that feel like a
game rather than homework.

That gave us four objectives, and every decision in the project comes back to one
of them:

1. **Reward being somewhere, not typing something.** The phone's GPS, checked by
   the server, is what separates a real visit from a wish list.
2. **Never punish the player.** A check-off is never refused. A bad GPS reading
   costs you a mark, never the memory.
3. **Cover the whole city.** The spots come from OpenStreetMap, so all 24
   parishes are filled, not just the places the four of us happen to know.
4. **Make it worth opening twice.** Friends, a monthly leaderboard, a story that
   unlocks as you travel, and a collection that is pleasant to look at.

## Team

| Name | Student number | GitHub |
| --- | --- | --- |
| Jule Dörpinghaus | 73638 | [JuleDoerpinghaus](https://github.com/JuleDoerpinghaus) |
| Marleen Koch | 80851 | [marleenk03](https://github.com/marleenk03) |
| Sorcha Lauder | 71299 | [sorchalauder](https://github.com/sorchalauder) |
| Tim Ohlert | 74723 | [mittimmit123-web](https://github.com/mittimmit123-web) |

Each of us owns one screen and the code behind it; the file headers say who wrote
what. How we split the work, branch and review is in [AGENTS.md](AGENTS.md).

## What the app does

The app holds **1930 spots** across the **24 parishes** of Lisbon, in **8
categories**.

| Screen | What you can do |
| --- | --- |
| **Map** | A full-screen map of Lisbon in our own design, with one emoji marker per spot. Zoomed out it shows only the highlights, so the city stays readable; zoomed in, everything appears. Filter by category, or by what you have already collected. Each parish has its own colour, and locked ones are lighter. |
| **Check off** | Stand at a spot and add it to your journal, with a photo, a note and a rating if you want — all three optional. Within **150 m** the server adds a **"verified on site"** mark. The screen shows how accurate your GPS is and warns you when the reading is too vague to trust. |
| **Add spot** | The other way round: instead of finding yourself on the map, see the closest spots you have not collected yet, with a ⭐ on the ones near enough for the mark. |
| **Collection** | Your own journal. Spots collected, new this month, a photo gallery, and a tile per category that opens to show which parishes you have covered and which are still empty. Every new parish turns your photo into a **postcard** and unlocks the next chapter of the story. |
| **Friends** | Send a friend request, accept or deny the ones you get. A live leaderboard for new spots this month, a **crown** for the parish you lead, and today's weather over your buddy. |
| **First start** | An intro film with three 3D characters to pick from, then a short guided tour of the real screens. The **?** button brings both back at any time. |

## Tech stack

| Part | Tool |
| --- | --- |
| UI | React 19 + Vite |
| Map | Leaflet + MapLibre, our own style, data from OpenStreetMap via OpenFreeMap |
| 3D characters | three.js, loaded only when the intro actually runs |
| Login, database, photos | Supabase (Postgres, Row Level Security, private storage) |
| Hosting | Vercel |
| Tests | Vitest, run by GitHub Actions on every pull request |

## Open it on your phone

This is the way the app is meant to be used, and the quickest way to try it —
there is nothing to install and no keys to set up.

1. Open **https://lisboa-explora.vercel.app** in Safari (iPhone) or Chrome
   (Android).
2. Type your email. You get a login link by mail; open it on the same phone and
   you are in. There is no password.
3. Allow location when the app asks for it.

Step 3 is the one that matters. The app runs without location — you can look at
the map, read the story, browse your collection — but the GPS is what earns the
**"verified on site"** mark, and that is the whole game. On a laptop the browser
guesses your position from the wifi network, which in Lisbon can be a kilometre
out, so the mark will not behave the way it does in the street.

### Add it to the home screen (optional)

| Phone | How |
| --- | --- |
| iPhone | Share button → *Add to Home Screen* |
| Android | Menu (⋮) → *Add to Home screen* |

It then opens full screen with its own icon and no browser bar, like an app from
the store. It still needs an internet connection: there is no offline mode.

## Run it on your computer

This section is for working on the code. To simply use the app, open the link
above on a phone instead.

1. Install **Node.js** (LTS version) from nodejs.org.
2. Clone this repository and open the folder in a terminal:
   ```
   git clone https://github.com/mittimmit123-web/lisboa-explora.git
   cd lisboa-explora
   ```
3. Install the libraries (once):
   ```
   npm install
   ```
4. Start the app:
   ```
   npm run dev
   ```
   Open the address it prints, usually http://localhost:5173.

**You do not need any keys to try it.** Without a `.env` file the app runs in
**demo mode**: no login, the data stays in your browser, the friends are made up.
Everything you can click still works.

To use the real database instead, copy `.env.example` to `.env` and fill in the
two Supabase values (see *Setting up Supabase* below). **Never commit `.env`.**

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm test` | Run the tests |
| `npm run lint` | Run oxlint |
| `npm run build` | Build the production version (Vercel does this automatically) |
| `npm run seed` | Regenerate `supabase/seed.sql` after changing `src/data/spots.js` |

## Tests

21 test files cover the parts that are pure logic: distances and the radius,
progress counts, the leaderboard, the story and intro state, photo shrinking,
marker rules, map maths and the OpenStreetMap import filter. The screens
themselves are checked by hand.

Every pull request and every push to `main` runs `npm test` and a production
build on GitHub Actions (`.github/workflows/tests.yml`). Nothing reaches `main`
on a red build.

## Folder map

```
src/
  App.jsx                switches between the screens
  screens/               one file per screen
    MapScreen            the map and its filters
    CheckOffScreen       GPS, photo, note, rating
    AddSpotScreen        the closest spots you have not collected
    CollectionScreen     your journal, gallery, postcards, story
    FriendsScreen        requests, leaderboard, crowns, weather
    LoginScreen          magic-link login (only when Supabase is configured)
  components/            reusable pieces (NavBar, filters, intro, tour, postcards)
  data/
    spots.js             THE list of spots (name, category, parish, coordinates)
    neighbourhoods.js    the 24 parishes of Lisbon
    categories.js        categories and their colours
    parishes.js          parish borders for the map
    story.js, facts.js   one chapter and one real fact per parish
  lib/
    api.js               the ONLY file that talks to Supabase (with demo mode)
    geo.js               distances, the 150 m radius, the weak-GPS threshold
    progress.js          counts for the Collection (pure functions, tested)
    friends.js           leaderboard and crown rules
    nearby.js            the closest uncollected spots
    markers.js           what the map shows at which zoom
    journal.js           the rules for notes and ratings
    supabase.js          connection from .env
    useGeolocation.js    live GPS position
supabase/
  schema.sql             tables, security rules, the check_off function
  seed.sql               the spots for the database (generated, do not edit)
tests/                   Vitest tests
```

## Setting up Supabase (once, project owner)

1. Create a free project on supabase.com (log in with GitHub).
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. SQL Editor → New query → paste `supabase/seed.sql` → Run.
4. Authentication → URL Configuration: add your Vercel URL and
   `http://localhost:5173` as redirect URLs.
5. Project Settings → API: copy *Project URL* and *anon public key* into `.env`
   and into Vercel → Settings → Environment Variables.

Two things worth knowing. `schema.sql` can be run again at any time without
losing data, and it has to be run again whenever it changes — the rules live in
the database, not in the deployed app. And free Supabase projects pause after a
week without use, so open the app once before a demo.

## How a check-off works

A check-off **never fails because of distance**. The spot always goes into the
player's journal, even days later or from the sofa. The GPS position decides one
thing only: whether the entry gets a **"verified on site"** mark.

The radius is **150 m**. We started at 50 m and the database showed us it was
wrong: nine of the ten closest attempts missed the mark by 11 to 29 metres, while
the testers were standing in front of the spots. In the narrow streets of central
Lisbon the signal bounces off the buildings, so 50 m was measuring the quality of
the signal rather than the visit. The reasoning is decision 25 in
[DECISIONS.md](DECISIONS.md).

This keeps the app a personal journal instead of a test you can fail, while the
rule that matters lives where it cannot be faked: on the server.

## Security

- The **"verified on site" mark is decided by the server** (the `check_off`
  function in `schema.sql`), never by the browser. A player cannot set it.
- **Row Level Security**: players can only read their own check-offs, and nobody
  can write to the tables directly — every write goes through a function.
- A photo must really exist in storage before it can be attached to a check-off.
- Photos go to a **private bucket**; each player can only upload into their own
  folder. Images only, 5 MB maximum.
- Each spot can be collected **once per player** (enforced by the database).
- Friendship needs both sides: a request has to be accepted.
- The Supabase publishable key in `.env` is not a secret — it is safe in the
  browser because the row-level rules, not the key, decide what a player may see.

## Documentation

| File | What is in it |
| --- | --- |
| [DECISIONS.md](DECISIONS.md) | 25 decisions: what we chose, why, and what we knowingly gave up |
| [AGENTS.md](AGENTS.md) | How we work: branches, pull requests, who owns what |
| `supabase/schema.sql` | The database, commented line by line |

`DECISIONS.md` is the one to read if you want to know why the app looks the way
it does. We wrote it as we went, so that any of us can explain any part of the
project, not only the part we wrote ourselves.
