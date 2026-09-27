# Khalwety | خلوتي

A private, bilingual (Arabic RTL / English LTR) 365-day spiritual journal.
Built with React 19 + TypeScript, TanStack Start/Router, Tailwind CSS v4, and your **own external Supabase** project.

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `database/001_khalwety_init.sql`, and run it. This creates `profiles`, `journeys`, `journal_entries`, `prayer_requests`, indexes, `updated_at` triggers, integrity triggers, a signup profile trigger, grants, and strict per-user RLS.
3. **Project Settings → API**: copy the Project URL and the `anon` public key.
   Never use the `service_role` key in this app.
4. **Authentication → URL Configuration**:
   - Site URL: your production URL (e.g. `https://khalwety.pages.dev`)
   - Redirect URLs: `http://localhost:8080/auth/callback`, `https://khalwety.pages.dev/auth/callback` (plus any custom domain).

## 2. Google OAuth
1. Google Cloud Console → **APIs & Services → OAuth consent screen** → configure (External).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Authorized redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret into Supabase **Authentication → Providers → Google** and enable it.

Both "Sign up with Google" and "Sign in with Google" use Supabase Google OAuth. After the callback (`/auth/callback`) the app idempotently ensures a profile and a journey exist; `journeys.start_date` is written once with the user's local date and is locked by a DB trigger.

## 3. Local development
```bash
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
bun install            # or npm install
bun run dev
```

## 4. GitHub
```bash
git init && git add . && git commit -m "Khalwety"
git remote add origin https://github.com/<you>/khalwety.git
git push -u origin main
```
`.env` is git-ignored; only `.env.example` is committed.

## 5. Cloudflare Pages
1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** and select the repo.
2. Build command: `npm run build` · Output directory: `dist/client` (static assets). SPA fallback is provided by `public/_redirects` (`/* /index.html 200`).
   - Alternatively deploy the full SSR build as a Cloudflare Worker with `npx wrangler deploy` (the project targets Workers natively).
3. **Environment variables** (Production + Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Add the Pages URL `/auth/callback` to Supabase Redirect URLs.

## 365-day logic
- Day 1 = `start_date`; Day N date = `start_date + (N-1)`.
- `current_day = clamp(floor(today - start_date) + 1, 1, 365)`.
- Past/current days editable; future days visible but locked; after day 365 everything stays open.
- Progress = entries marked completed (not elapsed days).

## Replacing the cover photo
Replace `src/assets/cover-portrait.jpg` with your photo (portrait 4:5 works best).
