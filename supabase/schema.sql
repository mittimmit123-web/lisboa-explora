-- Lisboa Explora: database schema for Supabase
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.
-- Then run seed.sql to load the spots.
--
-- Security idea in one sentence:
-- players can READ their own data, but they can only WRITE through the
-- functions below, which check the rules (own photos, one spot per player).
-- The server also decides whether a check-off counts as "verified on site";
-- the browser can never set that flag itself.

-- ---------- Tables ----------

-- One row per player. Filled automatically when someone signs up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- The spots. Loaded from seed.sql (generated from src/data/spots.js).
create table if not exists public.spots (
  id text primary key,
  name text not null,
  category text not null,
  neighbourhood text not null,
  lat double precision not null,
  lng double precision not null,
  rarity text not null default 'common'
);

-- One row per collected spot. A player can collect each spot only once.
create table if not exists public.check_offs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  spot_id text not null references public.spots (id),
  photo_path text,
  -- lat/lng may be null: the player can add a spot without a GPS position
  lat double precision,
  lng double precision,
  -- true only if the server measured the player within 150 m of the spot
  verified boolean not null default false,
  -- What the player wrote and how they liked it. Both optional: a check-off
  -- needs nothing but the spot. See DECISIONS.md.
  note text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

-- The two columns above were added later, so a database created before them
-- gets them here. Running this file again is safe either way.
alter table public.check_offs add column if not exists note text;
alter table public.check_offs add column if not exists rating smallint;
do $$
begin
  alter table public.check_offs add constraint check_offs_rating_check check (rating between 1 and 5);
exception
  when duplicate_object then null;
end
$$;

-- Friendships are stored in both directions (A->B and B->A).
create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- Friend requests that are still waiting for an answer (from -> to).
-- Accepting one turns it into a friendship; denying deletes it.
create table if not exists public.friend_requests (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

-- ---------- Row Level Security ----------
-- RLS on = nobody can read or write a table unless a policy allows it.

alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.check_offs enable row level security;
alter table public.friendships enable row level security;
-- No policies at all: requests are only read and changed through the functions below.
alter table public.friend_requests enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "everyone logged in can read spots" on public.spots;
create policy "everyone logged in can read spots" on public.spots
  for select to authenticated using (true);

drop policy if exists "read own check-offs" on public.check_offs;
create policy "read own check-offs" on public.check_offs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships" on public.friendships
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies: writes only happen through the
-- functions below (security definer = they run with the owner's rights,
-- after checking the rules themselves).

-- ---------- New user -> profile ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Distance (same formula as src/lib/geo.js) ----------

create or replace function public.distance_m(lat1 double precision, lng1 double precision,
                                             lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ---------- Check off a spot ----------
-- A check-off NEVER fails because of distance. The server only decides
-- whether the entry gets the "verified on site" mark (within 150 m).
--
-- Photo, note and rating are ALL optional: the spot itself is the entry,
-- everything else is something the player may add. See DECISIONS.md.

-- The function used to take four arguments. Drop that one, or the database
-- would keep both and not know which to call.
drop function if exists public.check_off(text, double precision, double precision, text);

create or replace function public.check_off(p_spot_id text,
                                            p_lat double precision default null,
                                            p_lng double precision default null,
                                            p_photo_path text default null,
                                            p_note text default null,
                                            p_rating int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_spot public.spots;
  v_distance double precision;
  v_verified boolean := false;
  v_note text;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'not_logged_in');
  end if;

  select * into v_spot from public.spots where id = p_spot_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_spot');
  end if;

  -- A photo is optional. If there is one, it must be in the player's own
  -- folder: photos/<user id>/...
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> v_user::text then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;

  -- ...and it must really have been uploaded. Without this, someone calling
  -- the function directly could point to a photo that does not exist
  -- (security gap 2 in docs/security-check.md).
  if p_photo_path is not null and not exists (
    select 1 from storage.objects where bucket_id = 'photos' and name = p_photo_path
  ) then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;

  -- The note and the rating come from the browser, so the server checks them
  -- rather than trusting what arrives. A blank note is stored as nothing.
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if length(v_note) > 500 then
    return jsonb_build_object('ok', false, 'reason', 'note_too_long');
  end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then
    return jsonb_build_object('ok', false, 'reason', 'bad_rating');
  end if;

  -- Distance decides the "verified on site" mark and nothing else.
  -- No GPS position (null) simply means "not verified".
  if p_lat is not null and p_lng is not null then
    v_distance := public.distance_m(p_lat, p_lng, v_spot.lat, v_spot.lng);
    v_verified := v_distance <= 150;
  end if;

  insert into public.check_offs (user_id, spot_id, photo_path, lat, lng, verified, note, rating)
  values (v_user, p_spot_id, p_photo_path, p_lat, p_lng, v_verified, v_note, p_rating)
  on conflict (user_id, spot_id) do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_collected');
  end if;

  return jsonb_build_object('ok', true, 'verified', v_verified,
                            'distance', case when v_distance is null then null
                                             else round(v_distance) end);
end;
$$;

-- ---------- Your name ----------

-- The name friends see on the leaderboard. Starts as the email name (see
-- handle_new_user); the player can change it. Checked here, never trusted
-- from the browser: 2-20 characters after trimming spaces, and no other
-- player may have the same name (capitals don't count: "Ana" = "ana").
create or replace function public.set_display_name(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_logged_in');
  end if;
  if length(v_name) not between 2 and 20 then
    return jsonb_build_object('ok', false, 'reason', 'bad_name');
  end if;
  if exists (select 1 from public.profiles where lower(display_name) = lower(v_name) and id <> auth.uid()) then
    return jsonb_build_object('ok', false, 'reason', 'name_taken');
  end if;
  update public.profiles set display_name = v_name where id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- Friends ----------

-- Sends a friend request (security check, weak spot 3). Nobody becomes friends
-- without saying yes. The answer is the same whether the email has an account
-- or not ('sent'), so this can't be used to find out who plays.
-- Special cases, only for people who already know each other:
--   'already_friends' = you are friends already
--   'friends'         = they had already asked you, so this counts as yes
create or replace function public.add_friend(p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_friend uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'not_logged_in');
  end if;
  select id into v_friend from public.profiles where lower(email) = lower(trim(p_email));
  if v_friend is null or v_friend = v_user then
    return jsonb_build_object('ok', true, 'status', 'sent');
  end if;
  if exists (select 1 from public.friendships where user_id = v_user and friend_id = v_friend) then
    return jsonb_build_object('ok', true, 'status', 'already_friends');
  end if;
  if exists (select 1 from public.friend_requests where from_id = v_friend and to_id = v_user) then
    delete from public.friend_requests where from_id = v_friend and to_id = v_user;
    insert into public.friendships (user_id, friend_id) values (v_user, v_friend), (v_friend, v_user)
    on conflict do nothing;
    return jsonb_build_object('ok', true, 'status', 'friends');
  end if;
  insert into public.friend_requests (from_id, to_id) values (v_user, v_friend)
  on conflict do nothing;
  return jsonb_build_object('ok', true, 'status', 'sent');
end;
$$;

-- Requests other players sent to me: their id and the name they chose.
create or replace function public.my_friend_requests()
returns table (from_id uuid, display_name text)
language sql security definer set search_path = public as $$
  select r.from_id, p.display_name
  from public.friend_requests r
  join public.profiles p on p.id = r.from_id
  where r.to_id = auth.uid()
  order by r.created_at;
$$;

-- Yes (p_accept = true) or no to a request someone sent me. Either way the
-- request is gone afterwards. A "no" is quiet: the sender is not told.
create or replace function public.answer_friend_request(p_from uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'not_logged_in');
  end if;
  delete from public.friend_requests where from_id = p_from and to_id = v_user;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_request');
  end if;
  if p_accept then
    insert into public.friendships (user_id, friend_id) values (v_user, p_from), (p_from, v_user)
    on conflict do nothing;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Me + my friends, with the number of new spots this calendar month, and
-- (since the start) how many spots each one has in every neighbourhood:
-- hood_counts = {"Belém": 3, "Alfama": 1}. The app ranks by spots or by
-- neighbourhoods and gives titles ("Ruler of Belém") from hood_counts.
-- Counts EVERY check-off, verified or not: the leaderboard is a friendly race.
-- The return type changed, so the old function must be dropped first.
drop function if exists public.friends_leaderboard();
create function public.friends_leaderboard()
returns table (display_name text, new_this_month bigint, is_me boolean, hood_counts jsonb)
language sql security definer set search_path = public as $$
  with players as (
    select auth.uid() as id
    union
    select friend_id from public.friendships where user_id = auth.uid()
  ),
  per_hood as (
    select c.user_id, s.neighbourhood, count(*) as spots
    from public.check_offs c
    join public.spots s on s.id = c.spot_id
    where c.user_id in (select id from players)
    group by c.user_id, s.neighbourhood
  )
  select p.display_name,
         (select count(*) from public.check_offs c
           where c.user_id = p.id and c.created_at >= date_trunc('month', now())) as new_this_month,
         p.id = auth.uid() as is_me,
         coalesce((select jsonb_object_agg(h.neighbourhood, h.spots) from per_hood h where h.user_id = p.id),
                  '{}'::jsonb) as hood_counts
  from players pl
  join public.profiles p on p.id = pl.id
  order by new_this_month desc;
$$;

-- ---------- Photo storage ----------
-- Private bucket. Each player may only upload to and read their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "read own photos" on storage.objects;
create policy "read own photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
