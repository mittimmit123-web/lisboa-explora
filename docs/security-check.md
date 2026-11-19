# Security check: can a player cheat? (issue #9)

Checked by Sorcha on 19 Nov 2026, by reading `supabase/schema.sql` on `main`.
The rules still need to be tried against the live Supabase database once #7
is finished (see "Live tests to do" at the end).

## How the app protects itself

The browser can be changed by anyone, so the app never trusts it with
anything important. The rules live in the database instead:

- **Row Level Security (RLS)** is on for every table. A player can only
  *read* their own profile, check-offs and friendships. Spots can be read by
  everyone who is logged in.
- **No table can be written to directly.** There are no insert, update or
  delete policies. All writes go through server functions (`check_off`,
  `add_friend`) that check the rules first.
- **Photos are private.** Each player can only upload to and read their own
  folder, `photos/<user id>/`. Files are limited to 5 MB and image types.

## Results

| Cheat attempt | Safe? | What stops it |
| --- | --- | --- |
| Write directly into a table, e.g. give yourself 100 spots | ✅ | No insert/update/delete policies, so the database refuses |
| Collect the same spot twice | ✅ | `unique (user_id, spot_id)` on `check_offs`; the server answers `already_collected` |
| Read other players' check-offs or profiles | ✅ | RLS: only your own rows (`user_id = auth.uid()`) |
| Upload into or read someone else's photo folder | ✅ | Storage policies only allow your own folder |
| Use the server functions without logging in | ✅ | Every function checks `auth.uid()` first; the leaderboard returns nothing |
| Check off a spot that does not exist | ✅ | `check_off` answers `unknown_spot` |
| Fake the "verified on site" mark | ⚠️ | See weak spot 1 |
| Check off without uploading a photo | ⚠️ | See weak spot 2 |
| Add someone as a friend without asking | ⚠️ | See weak spot 3 |

## Weak spots

### 1. The position comes from the browser (known limit)

`check_off` measures the distance itself, so the browser cannot simply say
"verified". But the position it measures from is sent by the browser. A
cheater could send the spot's own coordinates from home and get the mark.

No web app can fully stop this: the server never sees the phone, only what
the phone says. Since #16 this only affects the "verified on site" mark, not
whether a spot can be collected, so the damage is small.

**Decision:** accept it as a known limit. An idea for later: refuse the mark
when the player would have moved impossibly fast since their last check-off
(e.g. two spots 5 km apart within one minute).

### 2. The photo is not checked to exist (small fix)

`check_off` checks that the photo path is in the player's own folder, but not
that a photo was really uploaded there. Calling the function directly with a
made-up path saves a check-off without a photo.

**Suggested fix** for Tim, in `check_off` after the folder check:

```sql
if not exists (select 1 from storage.objects
               where bucket_id = 'photos' and name = p_photo_path) then
  return jsonb_build_object('ok', false, 'reason', 'bad_photo');
end if;
```

The app already shows a clear message for `bad_photo`.

### 3. Friends are added without asking (medium fix)

`add_friend(email)` immediately makes both players friends. Anyone who knows
your email can add you and see your display name and monthly count. The
answer (`ok: true` or `ok: false`) also tells them whether that email has an
account.

**Suggested fix** for Tim and Marleen (#11): turn it into a friend request
that the other player accepts, and give the same answer whether the email
exists or not ("If this person uses Lisboa Explora, they'll get your
request").

## Live tests to do after #7

- [ ] Logged in as player A, try to read player B's `check_offs` → no rows
- [ ] Try to insert a row into `check_offs` directly → refused
- [ ] Upload a photo to `photos/<B's id>/` as player A → refused
- [ ] Call `check_off` twice for the same spot → `already_collected`
- [ ] Call `check_off` with a made-up photo path → `bad_photo` (after fix 2)
- [ ] Log out and call `check_off` → `not_logged_in`
