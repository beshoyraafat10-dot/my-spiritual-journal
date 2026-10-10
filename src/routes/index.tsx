import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import cover from "@/assets/cover-portrait.jpg";
import { useI18n } from "@/lib/i18n";
import { useAuth, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { bootstrapUser } from "@/lib/data";
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

function Cover() {
  const { t, lang } = useI18n();
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (ready && session) navigate({ to: "/home", replace: true });
  }, [ready, session, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { needsConfirmation } = await signUpWithEmail(email.trim(), password, name.trim());
        if (needsConfirmation) {
          setInfo(t("checkEmail"));
          setMode("signin");
          return;
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
      await bootstrapUser(lang);
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      if (msg.includes("invalid login")) setErr(t("badLogin"));
      else if (msg.includes("not confirmed")) setErr(t("notConfirmed"));
      else if (msg.includes("already registered")) setErr(t("alreadyRegistered"));
      else setErr(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-full border border-gold/60 bg-paper/95 px-5 py-3 text-plum placeholder:text-plum/50 outline-none focus:border-gold focus:ring-2 focus:ring-gold/40";

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
          <form onSubmit={submit} className="mt-6 flex w-full flex-col gap-3">
            {mode === "signup" && (
              <input className={input} type="text" autoComplete="name" required placeholder={t("yourName")} value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input className={input} type="email" dir="ltr" autoComplete="email" inputMode="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className={input}
              type="password"
              dir="ltr"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              placeholder={mode === "signup" ? `${t("password")} — ${t("passwordHint")}` : t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="rounded-full bg-gold px-5 py-3 font-semibold text-plum shadow-soft transition hover:brightness-105 disabled:opacity-60"
            >
              {busy ? t("loading") : mode === "signup" ? t("signUp") : t("signIn")}
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(null); }}
              className="text-sm text-primary-foreground/90 underline-offset-4 hover:underline"
            >
              {mode === "signup" ? t("haveAccount") : t("noAccount")}
            </button>
          </form>
          {info && <p className="mt-4 text-sm text-gold">{info}</p>}
          {!isSupabaseConfigured && <p className="mt-4 text-xs text-rose">{t("notConfigured")}</p>}
          {err && <p className="mt-4 text-xs text-rose">{err}</p>}
        </div>
      </div>
    </main>
  );
}
