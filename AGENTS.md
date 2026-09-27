<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Backend is the user's external Supabase via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (src/lib/supabase.ts); never Lovable Cloud — user requirement.
- SQL schema lives in database/*.sql, run manually in the user's Supabase — keeps migrations portable.
- Protected pages live under pathless `_app` layout (ssr: false) — session is in localStorage.
- Journey date math in src/lib/journey.ts uses local YYYY-MM-DD strings — avoids timezone drift.
