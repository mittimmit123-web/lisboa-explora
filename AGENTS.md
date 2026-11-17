# Notes for the team and for AI coding assistants

## Who owns what

| Person | Area | Main files |
| --- | --- | --- |
| 1 | Map & spots | `src/screens/MapScreen.jsx`, `src/components/CategoryFilter.jsx`, `src/data/spots.js` |
| 2 | Check-off (GPS, photo, upload) | `src/screens/CheckOffScreen.jsx`, `src/lib/useGeolocation.js`, `checkOff` in `src/lib/api.js` |
| 3 | Backend, login, security, deployment | `supabase/`, `src/lib/supabase.js`, `src/lib/api.js`, `src/screens/LoginScreen.jsx` |
| 4 | Collection, friends, design | `src/screens/CollectionScreen.jsx`, `src/screens/FriendsScreen.jsx`, `src/lib/progress.js`, `src/index.css` |

Everyone must be able to explain every part: in the walkthrough each member is asked about code they did not write.

## Workflow

1. Pick an issue, assign yourself.
2. Create a branch: `git checkout -b 12-category-filter` (issue number + short name).
3. Commit small steps with clear messages.
4. Run `npm test` and `npm run build` before pushing.
5. Open a pull request and ask the next person to review (1 → 2 → 3 → 4 → 1).
6. Merge only after one approval. `main` is deployed automatically by Vercel.

## Rules for code (humans and AI assistants)

- **Everything in English**: code, comments, commit messages, issues, pull requests, docs and UI text. Only real place names stay in Portuguese.
- Keep it simple and readable. Beginners must understand it.
- Screens never call Supabase directly: always go through `src/lib/api.js`.
- Logic that can be tested (distances, percentages, ranking) goes into `src/lib/` as plain functions, with a test in `tests/`.
- A check-off is never refused because of distance. The **"verified on site" decision** must stay on the server (`supabase/schema.sql`); the browser copy in `geo.js` is only for display.
- Never commit `.env` or any key.
- Spots are edited only in `src/data/spots.js`, then run `npm run seed` and run `supabase/seed.sql` in Supabase.
- Explain what you changed in the pull request in plain words.

## Commands

- `npm install` once, `npm run dev` to start, `npm test` for tests, `npm run build` to check the build.
