import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJourney, getProfile, updateLanguage } from "@/lib/data";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { TOTAL_DAYS, currentDay, dateForDay, formatDate, formatNumber } from "@/lib/journey";
import { Centered, Spinner } from "@/components/Shell";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile | Khalwety" }, { name: "description", content: "Your profile and settings." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { session } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pq = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const jq = useQuery({ queryKey: ["journey"], queryFn: getJourney });

  if (pq.isLoading || jq.isLoading) return <Centered><Spinner /></Centered>;
  if (pq.error || jq.error) return <Centered><p>{t("errorGeneric")}</p></Centered>;

  const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = pq.data?.display_name ?? meta["full_name"] ?? session?.user.email;
  const avatar = pq.data?.avatar_url ?? meta["avatar_url"];
  const start = jq.data!.start_date;

  const changeLang = (l: Lang) => { setLang(l); void updateLanguage(l); };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="space-y-5">
      <section className="paper-card flex flex-col items-center p-6 text-center">
        {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-full border-4 border-gold/60 object-cover" />
          : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary font-display text-4xl text-primary">{String(name ?? "?")[0]}</div>}
        <h1 className="mt-3 text-3xl font-semibold text-primary">{name}</h1>
        <p className="text-sm text-muted-foreground">{session?.user.email}</p>
      </section>

      <section className="paper-card space-y-3 p-6 text-sm">
        <Row k={t("startedOn")} v={formatDate(start, lang)} />
        <Row k={t("journeyDay")} v={`${formatNumber(currentDay(start), lang)} / ${formatNumber(TOTAL_DAYS, lang)}`} />
        <Row k={t("endsOn")} v={formatDate(dateForDay(start, TOTAL_DAYS), lang)} />
      </section>

      <section className="paper-card flex items-center justify-between p-6">
        <span className="font-medium text-plum">{t("language")}</span>
        <div className="inline-flex rounded-full border border-gold/50 p-0.5 text-sm" dir="ltr">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} onClick={() => changeLang(l)} className={`rounded-full px-4 py-1 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </section>

      <button onClick={signOut} className="w-full rounded-full border border-destructive/40 py-3 font-medium text-destructive hover:bg-destructive/5">{t("signOut")}</button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium text-plum">{v}</span></div>;
}
