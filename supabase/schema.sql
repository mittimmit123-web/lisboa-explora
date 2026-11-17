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
  -- true only if the server measured the player within 50 m of the spot
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

-- Friendships are stored in both directions (A->B and B->A).
create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- ---------- Row Level Security ----------
-- RLS on = nobody can read or write a table unless a policy allows it.

alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.check_offs enable row level security;
alter table public.friendships enable row level security;

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
-- whether the entry gets the "verified on site" mark (within 50 m).

create or replace function public.check_off(p_spot_id text, p_lat double precision,
                                            p_lng double precision, p_photo_path text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_spot public.spots;
  v_distance double precision;
  v_verified boolean := false;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'not_logged_in');
  end if;

  select * into v_spot from public.spots where id = p_spot_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_spot');
  end if;

  -- The photo must be in the player's own folder: photos/<user id>/...
  if p_photo_path is null or split_part(p_photo_path, '/', 1) <> v_user::text then
    return jsonb_build_object('ok', false, 'reason', 'bad_photo');
  end if;

  -- Distance decides the "verified on site" mark and nothing else.
  -- No GPS position (null) simply means "not verified".
  if p_lat is not null and p_lng is not null then
    v_distance := public.distance_m(p_lat, p_lng, v_spot.lat, v_spot.lng);
    v_verified := v_distance <= 50;
  end if;

  insert into public.check_offs (user_id, spot_id, photo_path, lat, lng, verified)
  values (v_user, p_spot_id, p_photo_path, p_lat, p_lng, v_verified)
  on conflict (user_id, spot_id) do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_collected');
  end if;

  return jsonb_build_object('ok', true, 'verified', v_verified,
                            'distance', case when v_distance is null then null
                                             else round(v_distance) end);
end;
$$;

-- ---------- Friends ----------

create or replace function public.add_friend(p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_friend uuid;
begin
  select id into v_friend from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null or v_friend is null or v_friend = v_user then
    return jsonb_build_object('ok', false);
  end if;
  insert into public.friendships (user_id, friend_id) values (v_user, v_friend), (v_friend, v_user)
  on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- Me + my friends, with the number of new spots this calendar month.
-- Counts EVERY check-off, verified or not: the leaderboard is a friendly
-- comparison, not a competition.
create or replace function public.friends_leaderboard()
returns table (display_name text, new_this_month bigint, is_me boolean)
language sql security definer set search_path = public as $$
  with players as (
    select auth.uid() as id
    union
    select friend_id from public.friendships where user_id = auth.uid()
  )
  select p.display_name,
         count(c.id) filter (where c.created_at >= date_trunc('month', now())) as new_this_month,
         p.id = auth.uid() as is_me
  from players pl
  join public.profiles p on p.id = pl.id
  left join public.check_offs c on c.user_id = p.id
  group by p.id, p.display_name
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
