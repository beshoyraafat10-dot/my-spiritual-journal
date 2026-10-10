# Khalwety | خلوتي

A private, bilingual (Arabic RTL / English LTR) 365-day spiritual journal.
Built with React 19 + TypeScript, TanStack Start/Router, Tailwind CSS v4, and your **own external Supabase** project.

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `database/001_khalwety_init.sql`, and run it. This creates `profiles`, `journeys`, `journal_entries`, `prayer_requests`, indexes, `updated_at` triggers, integrity triggers, a signup profile trigger, grants, and strict per-user RLS.
3. **Project Settings → API**: copy the Project URL and the `anon` public key.
   Never use the `service_role` key in this app.
4. **Authentication → URL Configuration**:
   - Site URL: your production URL (e.g. `https://khalwety.vercel.app`)
   - Redirect URLs: `http://localhost:8080/auth/callback`, `https://khalwety.vercel.app/auth/callback` (plus any custom domain).

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

## 5. Vercel (free hosting)
1. Sign in at https://vercel.com with GitHub → **Add New → Project** → import this repo. Vercel detects the settings automatically.
2. **Environment Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then **Deploy**.
3. In Supabase **Authentication → URL Configuration**, set Site URL to your Vercel URL and add `<your-vercel-url>/auth/callback` to Redirect URLs.
4. Every push to `main` redeploys automatically.

## 6. Install on a phone
The app is a PWA (installable web app). Share the Vercel link, then:
- **iPhone:** open in Safari → Share → **Add to Home Screen**.
- **Android:** open in Chrome → **Install** (or ⋮ → **Add to Home screen**).

## 365-day logic
- Day 1 = `start_date`; Day N date = `start_date + (N-1)`.
- `current_day = clamp(floor(today - start_date) + 1, 1, 365)`.
- Past/current days editable; future days visible but locked; after day 365 everything stays open.
- Progress = entries marked completed (not elapsed days).

## Replacing the cover photo
Replace `src/assets/cover-portrait.jpg` with your photo (portrait 4:5 works best).
