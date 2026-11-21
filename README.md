# Lisboa Explora

**Collect Lisbon, one spot at a time.** Visit real places in Lisbon (viewpoints, parks, bars, food spots …), check them off with a photo, build your collection and compare with your friends every month.

Team project for *Introduction to Programming* (Nova SBE, 2026/27). Deadline: **23 Nov 2026**.

## Live app

**Deployed URL:** https://lisboa-explora.vercel.app

## Team

| Name | Student number | GitHub |
| --- | --- | --- |
| Jule Dörpinghaus | 73638 | [JuleDoerpinghaus](https://github.com/JuleDoerpinghaus) |
| Marleen Koch | 80851 | [marleenk03](https://github.com/marleenk03) |
| Sorcha Lauder | 71299 | [sorchalauder](https://github.com/sorchalauder) |
| Tim Ohlert | 74723 | [mittimmit123-web](https://github.com/mittimmit123-web) |

How to run the app and the tests: see [Run it on your computer](#run-it-on-your-computer) and [Useful commands](#useful-commands) below.

## What the app does (first version)

| Screen | What you can do |
| --- | --- |
| **Map** | See all spots, filter by category, tap a spot to see the distance |
| **Check off** | Take a photo and add the spot to your journal. Within 50 m it also gets a "verified on site" mark |
| **Collection** | Total spots, new this month, sets in % (e.g. "Bars in Bairro Alto: 20%"), neighbourhoods in % |
| **Friends** | Leaderboard "new spots this month" (live), add friends by email |

Full concept: see the *Variant A – Concept Description* doc shared in the team.

## Tech stack

| Part | Tool |
| --- | --- |
| UI | React + Vite |
| Map | Leaflet + MapLibre (own map design, data from OpenStreetMap via OpenFreeMap) |
| Login, database, photos | Supabase |
| Hosting | Vercel |
| Tests | Vitest |

## Run it on your computer

1. Install **Node.js** (LTS version) from nodejs.org.
2. Clone the repo and open the folder in a terminal.
3. Install the libraries (once):
   ```
   npm install
   ```
4. Start the app:
   ```
   npm run dev
   ```
   Open the address it prints (usually http://localhost:5173).

Without a `.env` file the app runs in **demo mode**: no login, data stays in your browser, fake friends. Good for building screens.

To use the real database, copy `.env.example` to `.env` and paste the two Supabase values (ask the person who owns the Supabase project; **never commit `.env`**).

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm test` | Run the tests |
| `npm run build` | Build the production version (Vercel does this automatically) |
| `npm run seed` | Regenerate `supabase/seed.sql` after changing `src/data/spots.js` |

## Folder map

```
src/
  App.jsx               switches between the screens
  screens/              one file per screen (Map, CheckOff, Collection, Friends, Login)
  components/           small reusable pieces (NavBar, CategoryFilter, ProgressBar)
  data/spots.js         THE list of spots (name, category, neighbourhood, coordinates)
  data/neighbourhoods.js the 24 parishes of Lisbon ("you've been to 7 of 24")
  data/categories.js    categories and their colours
  lib/geo.js            distance display and the 50 m "verified" threshold
  lib/progress.js       monthly count, category counts, neighbourhoods, ranking (pure functions, tested)
  lib/api.js            the ONLY file that talks to Supabase (with demo mode)
  lib/supabase.js       Supabase connection from .env
  lib/useGeolocation.js live GPS position
supabase/
  schema.sql            tables, security rules, check_off function (run once in Supabase)
  seed.sql              the spots for the database (generated, do not edit)
tests/                  Vitest tests
```

## Setting up Supabase (once, project owner)

1. Create a free project on supabase.com (log in with GitHub).
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. SQL Editor → New query → paste `supabase/seed.sql` → Run.
4. Authentication → URL Configuration: add your Vercel URL and `http://localhost:5173` as redirect URLs.
5. Project Settings → API: copy *Project URL* and *anon public key* into `.env` (and into Vercel → Settings → Environment Variables).

Note: free Supabase projects pause after a week without use. Open the app once before the presentation.

## How a check-off works

A check-off **never fails because of distance**. The spot always goes into the
player's journal, even days later or from the sofa. The GPS position only
decides one thing: whether the entry gets a **"verified on site"** mark, which
the player sees in the collection.

This keeps the app a personal journal instead of a test you can fail, while
the interesting rule still lives where it cannot be faked: on the server.

## Security

- The **"verified on site" mark is decided by the server** (`check_off` function in `schema.sql`), never by the browser. A player cannot set it.
- **Row Level Security**: players can only read their own check-offs; nobody can write directly to the tables.
- Photos go to a **private bucket**; each player can only upload to their own folder. Max 5 MB, images only.
- Each spot can be collected **once per player** (database rule).

## How we work together

See [AGENTS.md](AGENTS.md): branches, pull requests, who owns what.
