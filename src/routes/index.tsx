import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import cover from "@/assets/cover-portrait.jpg";
import { useI18n } from "@/lib/i18n";
import { useAuth, signInWithGoogle } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { LangToggle } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khalwety | خلوتي — My Spiritual Journal" },
      { name: "description", content: "مذكرتي الروحية — a private 365-day spiritual journal for reflection and prayer." },
      { property: "og:title", content: "Khalwety | خلوتي" },
      { property: "og:description", content: "A private 365-day bilingual spiritual journal." },
    ],
  }),
  component: Cover,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Cover() {
  const { t } = useI18n();
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<null | "signup" | "signin">(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (ready && session) navigate({ to: "/home", replace: true });
  }, [ready, session, navigate]);

  const go = async (intent: "signup" | "signin") => {
    setErr(null);
    setBusy(intent);
    try {
      await signInWithGoogle(intent);
    } catch {
      setErr(t("errorGeneric"));
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-md justify-end"><LangToggle /></div>
      <div className="cover-leather relative w-full max-w-md rounded-[1.75rem] p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-3 rounded-[1.4rem] border border-gold/60" />
        <div className="pointer-events-none absolute inset-y-0 start-0 w-4 rounded-s-[1.75rem] bg-foreground/20" />
        <div className="relative flex flex-col items-center text-center">
          <p className="font-display text-lg tracking-[0.3em] text-gold">✦ {t("appName")} ✦</p>
          <div className="mt-4 w-full overflow-hidden rounded-[1.25rem] border-4 border-gold/70 bg-paper p-1.5">
            {/* Replace src/assets/cover-portrait.jpg with your own photo with Jesus */}
            <img src={cover} alt={t("coverTitle")} width={768} height={1024} className="aspect-[4/5] w-full rounded-[0.9rem] object-cover" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-primary-foreground sm:text-5xl">{t("coverTitle")}</h1>
          <p className="mt-2 text-sm text-gold">{t("coverSub")}</p>
          <div className="mt-6 flex w-full flex-col gap-3">
            <button
              onClick={() => go("signup")}
              disabled={!!busy || !isSupabaseConfigured}
              className="flex items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 font-semibold text-plum shadow-soft transition hover:brightness-105 disabled:opacity-60"
            >
              <GoogleIcon /> {busy === "signup" ? t("loading") : t("signUp")}
            </button>
            <button
              onClick={() => go("signin")}
              disabled={!!busy || !isSupabaseConfigured}
              className="flex items-center justify-center gap-3 rounded-full border border-gold/70 bg-paper/10 px-5 py-3 font-semibold text-primary-foreground transition hover:bg-paper/20 disabled:opacity-60"
            >
              <GoogleIcon /> {busy === "signin" ? t("loading") : t("signIn")}
            </button>
          </div>
          {!isSupabaseConfigured && <p className="mt-4 text-xs text-rose">{t("notConfigured")}</p>}
          {err && <p className="mt-4 text-xs text-rose">{err}</p>}
        </div>
      </div>
    </main>
  );
}
