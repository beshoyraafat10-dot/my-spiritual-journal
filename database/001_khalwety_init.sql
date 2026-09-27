-- Khalwety | خلوتي — initial schema for YOUR external Supabase project.
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push` after copying into supabase/migrations).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text check (preferred_language in ('ar','en')) default 'ar',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  start_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  day_number int not null check (day_number between 1 and 365),
  entry_date date not null,
  god_attribute text,
  sin_to_avoid text,
  commandment_to_follow text,
  privilege_to_thank text,
  promise_to_hold text,
  example_to_follow text,
  prayer_response text,
  other_reflections text,
  memory_verse text,
  scripture_reference text,
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day_number)
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  request_text text not null,
  response_date date null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists journal_entries_user_idx on public.journal_entries(user_id);
create index if not exists journal_entries_journey_day_idx on public.journal_entries(journey_id, day_number);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, entry_date);
create index if not exists prayer_requests_user_idx on public.prayer_requests(user_id);
create index if not exists prayer_requests_entry_idx on public.prayer_requests(journal_entry_id);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_journeys_updated on public.journeys;
create trigger trg_journeys_updated before update on public.journeys for each row execute function public.set_updated_at();
drop trigger if exists trg_entries_updated on public.journal_entries;
create trigger trg_entries_updated before update on public.journal_entries for each row execute function public.set_updated_at();
drop trigger if exists trg_requests_updated on public.prayer_requests;
create trigger trg_requests_updated before update on public.prayer_requests for each row execute function public.set_updated_at();

-- start_date is set once and can never change
create or replace function public.lock_journey_start()
returns trigger language plpgsql as $$
begin
  new.start_date = old.start_date;
  new.user_id = old.user_id;
  return new;
end $$;
drop trigger if exists trg_journeys_lock on public.journeys;
create trigger trg_journeys_lock before update on public.journeys for each row execute function public.lock_journey_start();

-- entry must belong to caller's own journey; entry_date always = start_date + (day - 1)
create or replace function public.validate_journal_entry()
returns trigger language plpgsql security definer set search_path = public as $$
declare s date;
begin
  select start_date into s from public.journeys where id = new.journey_id and user_id = new.user_id;
  if s is null then raise exception 'journey does not belong to user'; end if;
  new.entry_date = s + (new.day_number - 1);
  return new;
end $$;
drop trigger if exists trg_entries_validate on public.journal_entries;
create trigger trg_entries_validate before insert or update on public.journal_entries for each row execute function public.validate_journal_entry();

-- prayer request must reference the caller's own entry
create or replace function public.validate_prayer_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.journal_entries where id = new.journal_entry_id and user_id = new.user_id) then
    raise exception 'entry does not belong to user';
  end if;
  return new;
end $$;
drop trigger if exists trg_requests_validate on public.prayer_requests;
create trigger trg_requests_validate before insert or update on public.prayer_requests for each row execute function public.validate_prayer_request();

-- Profile bootstrap on signup. The journey row is created by the client
-- (idempotent upsert) so start_date uses the user's LOCAL date.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

grant select, insert, update, delete on public.profiles, public.journeys, public.journal_entries, public.prayer_requests to authenticated;
grant all on public.profiles, public.journeys, public.journal_entries, public.prayer_requests to service_role;

alter table public.profiles enable row level security;
alter table public.journeys enable row level security;
alter table public.journal_entries enable row level security;
alter table public.prayer_requests enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','journeys','journal_entries','prayer_requests'] loop
    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_insert" on public.%I', t);
    execute format('drop policy if exists "own_update" on public.%I', t);
    execute format('drop policy if exists "own_delete" on public.%I', t);
    execute format('create policy "own_select" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "own_insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "own_update" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own_delete" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
  end loop;
end $$;
