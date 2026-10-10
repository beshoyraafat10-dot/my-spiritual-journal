-- Khalwety | خلوتي — AI-painted cover ("walking with Jesus") per user.
-- The generate-cover edge function writes these columns with the service role. Safe to re-run.

alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists cover_status text check (cover_status in ('pending', 'ready', 'failed'));
alter table public.profiles add column if not exists cover_generations int not null default 0;

-- Users may edit only their own name/photo/language; the cover columns (and the
-- generation count that caps OpenAI spend) are server-only.
revoke insert, update on public.profiles from authenticated;
grant insert (user_id, display_name, avatar_url, preferred_language) on public.profiles to authenticated;
grant update (display_name, avatar_url, preferred_language) on public.profiles to authenticated;
