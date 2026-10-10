import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { bootstrapUser, uploadAvatar } from "@/lib/data";
import { JourneyCover, ParchmentPage, Watermark } from "@/components/Ornate";
import { isSupabaseConfigured } from "@/lib/supabase";
import { LangToggle } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "خلوتي | الخلوة اليومية" },
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready && session && !busy) navigate({ to: "/home", replace: true });
  }, [ready, session, busy, navigate]);

  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

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
      // The account works without a photo, so a failed upload shouldn't block sign-up.
      if (mode === "signup" && photo) await uploadAvatar(photo).catch((e) => console.error(e));
      navigate({ to: "/home", replace: true });
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

  return (
    <div className="relative min-h-screen">
      <Watermark />
      <main className="relative z-10 mx-auto flex max-w-md flex-col gap-5 px-4 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <div className="flex justify-end"><LangToggle /></div>
        <JourneyCover
          name={mode === "signup" ? name : null}
          photoUrl={mode === "signup" ? preview : null}
          onPickPhoto={mode === "signup" ? () => fileRef.current?.click() : undefined}
          footer={t("coverSub")}
        />

        <ParchmentPage>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h2 className="text-center text-2xl text-ink">{mode === "signup" ? t("signUp") : t("signIn")}</h2>
            {mode === "signup" && (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className="mx-auto flex items-center gap-3 rounded-full border border-gold/60 bg-paper/80 py-1.5 pe-4 ps-1.5 text-sm font-semibold text-ink">
                  <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#f6dc93] to-[#b8862b] p-[2px]">
                    {preview ? <img src={preview} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-paper text-lg">📷</span>}
                  </span>
                  {preview ? t("changePhoto") : t("addPhoto")}
                </button>
                <p className="-mt-1 text-center text-xs text-muted-foreground">{t("photoHint")}</p>
                <input className="field" type="text" dir="rtl" autoComplete="name" required placeholder={t("yourName")} value={name} onChange={(e) => setName(e.target.value)} />
              </>
            )}
            <input className="field" type="email" dir="ltr" autoComplete="email" inputMode="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className="field"
              type="password"
              dir="ltr"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              placeholder={mode === "signup" ? `${t("password")} — ${t("passwordHint")}` : t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={busy || !isSupabaseConfigured} className="btn-gold mt-1 rounded-full px-5 py-3 font-display text-xl font-bold disabled:opacity-60">
              {busy ? t("loading") : mode === "signup" ? t("signUp") : t("signIn")}
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(null); }}
              className="text-sm font-semibold text-gold-deep underline-offset-4 hover:underline"
            >
              {mode === "signup" ? t("haveAccount") : t("noAccount")}
            </button>
            {info && <p className="text-center text-sm text-sage">{info}</p>}
            {err && <p className="text-center text-sm text-destructive">{err}</p>}
            {!isSupabaseConfigured && <p className="text-center text-xs text-destructive">{t("notConfigured")}</p>}
          </form>
        </ParchmentPage>
      </main>
    </div>
  );
}
