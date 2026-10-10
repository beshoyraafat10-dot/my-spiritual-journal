import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getJourney, updateDisplayName, updateLanguage, uploadAvatar } from "@/lib/data";
import { useI18n, type Lang } from "@/lib/i18n";
import { useMe } from "@/lib/me";
import { supabase } from "@/lib/supabase";
import { TOTAL_DAYS, currentDay, dateForDay, formatDate, formatNumber } from "@/lib/journey";
import { Centered, Spinner } from "@/components/Shell";
import { Corners, JourneyCover } from "@/components/Ornate";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile | Khalwety" }, { name: "description", content: "Your profile and settings." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = useMe();
  const jq = useQuery({ queryKey: ["journey"], queryFn: getJourney });
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "photo" | "name">(null);
  const [err, setErr] = useState<string | null>(null);
  const [savedName, setSavedName] = useState(false);

  if (me.profile.isLoading || jq.isLoading) return <Centered><Spinner /></Centered>;
  if (me.profile.error || jq.error) return <Centered><p>{t("errorGeneric")}</p></Centered>;

  const start = jq.data!.start_date;
  const shownName = name ?? me.name ?? "";

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBusy("photo");
    try {
      await uploadAvatar(file);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["avatar"] });
    } catch (e) {
      console.error(e);
      setErr(t("photoError"));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveName = async () => {
    const v = shownName.trim();
    if (!v) return;
    setBusy("name");
    setErr(null);
    try {
      await updateDisplayName(v);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      setName(null);
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2000);
    } catch {
      setErr(t("errorGeneric"));
    } finally {
      setBusy(null);
    }
  };

  const changeLang = (l: Lang) => { setLang(l); void updateLanguage(l); };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="space-y-5">
      <JourneyCover name={shownName || me.name} photoUrl={me.photoUrl} onPickPhoto={() => fileRef.current?.click()} />

      <section className="parchment gold-frame relative space-y-4 rounded-[1.25rem] p-6">
        <Corners size="w-12" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="btn-gold relative w-full rounded-full py-3 font-bold disabled:opacity-60">
          {busy === "photo" ? t("uploading") : me.photoUrl ? t("changePhoto") : t("addPhoto")}
        </button>
        <p className="relative text-center text-xs text-muted-foreground">{t("photoHint")}</p>

        <label className="relative block">
          <span className="mb-1.5 block text-sm font-bold text-ink">{t("yourName")}</span>
          <div className="flex gap-2">
            <input className="field" dir="auto" value={shownName} onChange={(e) => setName(e.target.value)} />
            <button onClick={saveName} disabled={!!busy || !shownName.trim() || shownName === me.name} className="shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {savedName ? "✓" : busy === "name" ? "…" : t("save")}
            </button>
          </div>
        </label>
        <p className="relative text-center text-sm text-muted-foreground" dir="ltr">{me.email}</p>
        {err && <p className="relative text-center text-sm text-destructive">{err}</p>}
      </section>

      <section className="parchment gold-frame relative space-y-3 rounded-[1.25rem] p-6 text-sm">
        <Row k={t("startedOn")} v={formatDate(start, lang)} />
        <Row k={t("journeyDay")} v={`${formatNumber(currentDay(start), lang)} / ${formatNumber(TOTAL_DAYS, lang)}`} />
        <Row k={t("endsOn")} v={formatDate(dateForDay(start, TOTAL_DAYS), lang)} />
      </section>

      <section className="parchment gold-frame relative flex items-center justify-between rounded-[1.25rem] p-6">
        <span className="font-bold text-ink">{t("language")}</span>
        <div className="inline-flex rounded-full border border-gold/50 p-0.5 text-sm" dir="ltr">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} onClick={() => changeLang(l)} className={`rounded-full px-4 py-1 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </section>

      <button onClick={signOut} className="w-full rounded-full border border-destructive/40 bg-paper/70 py-3 font-medium text-destructive hover:bg-destructive/5">{t("signOut")}</button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-bold text-ink">{v}</span></div>;
}
