## Architecture rules
- Backend is the user's external Supabase via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (src/lib/supabase.ts); never a hosted-platform backend — user requirement.
- Hosted on GitHub Pages as a static SPA under /my-spiritual-journal/ (no Lovable) — every push to main redeploys; build with GITHUB_PAGES=true, and keep URLs base-aware via import.meta.env.BASE_URL.
- SQL schema lives in database/*.sql, run manually in the user's Supabase — keeps migrations portable.
- Protected pages live under pathless `_app` layout (ssr: false) — session is in localStorage.
- Journey date math in src/lib/journey.ts uses local YYYY-MM-DD strings — avoids timezone drift.
