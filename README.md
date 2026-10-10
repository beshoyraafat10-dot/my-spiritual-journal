# Khalwety | خلوتي

A private, bilingual (Arabic RTL / English LTR) 365-day spiritual journal.
Built with React 19 + TypeScript, TanStack Start/Router, Tailwind CSS v4, and your **own external Supabase** project.

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `database/001_khalwety_init.sql`, and run it. This creates `profiles`, `journeys`, `journal_entries`, `prayer_requests`, indexes, `updated_at` triggers, integrity triggers, a signup profile trigger, grants, and strict per-user RLS.
3. **Project Settings → API**: copy the Project URL and the `anon` public key.
   Never use the `service_role` key in this app.
4. **Authentication → URL Configuration**:
   - Site URL: your production URL (e.g. `https://beshoyraafat10-dot.github.io/my-spiritual-journal`)
   - Redirect URLs: `http://localhost:8080/auth/callback`, `https://beshoyraafat10-dot.github.io/my-spiritual-journal/auth/callback` (plus any custom domain).

## 2. Google OAuth
1. Google Cloud Console → **APIs & Services → OAuth consent screen** → configure (External).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Authorized redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret into Supabase **Authentication → Providers → Google** and enable it.

Both "Sign up with Google" and "Sign in with Google" use Supabase Google OAuth. After the callback (`/auth/callback`) the app idempotently ensures a profile and a journey exist; `journeys.start_date` is written once with the user's local date and is locked by a DB trigger.

## 3. Local development
```bash
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 4. GitHub
```bash
git init && git add . && git commit -m "Khalwety"
git remote add origin https://github.com/<you>/khalwety.git
git push -u origin main
```
`.env` is git-ignored; only `.env.example` is committed.

## 5. Hosting (GitHub Pages, free)
Every push to `main` builds and publishes the app via `.github/workflows/pages.yml` to
https://beshoyraafat10-dot.github.io/my-spiritual-journal/
1. Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.production` (committed; the anon key is public — never the service_role key).
2. Supabase **Authentication → URL Configuration**: Site URL = the link above; add `https://beshoyraafat10-dot.github.io/my-spiritual-journal/auth/callback` to Redirect URLs.

## 6. Install on a phone
The app is a PWA (installable web app). Share the GitHub Pages link, then:
- **iPhone:** open in Safari → Share → **Add to Home Screen**.
- **Android:** open in Chrome → **Install** (or ⋮ → **Add to Home screen**).

## 365-day logic
- Day 1 = `start_date`; Day N date = `start_date + (N-1)`.
- `current_day = clamp(floor(today - start_date) + 1, 1, 365)`.
- Past/current days editable; future days visible but locked; after day 365 everything stays open.
- Progress = entries marked completed (not elapsed days).

## Replacing the cover photo
Replace `src/assets/cover-portrait.jpg` with your photo (portrait 4:5 works best).
