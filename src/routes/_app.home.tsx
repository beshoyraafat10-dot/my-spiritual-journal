import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getJourney, listEntrySummaries } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { TOTAL_DAYS, currentDay, dateForDay, dayForDate, formatDate, formatNumber, parseISO, rawDay, todayLocalISO } from "@/lib/journey";
import { Centered, Spinner } from "@/components/Shell";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "My Year | Khalwety" }, { name: "description", content: "Your 365-day journey overview." }] }),
  component: Home,
});

function Home() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const jq = useQuery({ queryKey: ["journey"], queryFn: getJourney });
  const eq = useQuery({ queryKey: ["entries"], queryFn: listEntrySummaries });
  const today = todayLocalISO();
  const [monthOffset, setMonthOffset] = useState<number | null>(null);

  const completed = useMemo(() => new Set((eq.data ?? []).filter((e) => e.is_completed).map((e) => e.day_number)), [eq.data]);
  const started = useMemo(() => new Set((eq.data ?? []).map((e) => e.day_number)), [eq.data]);

  if (jq.isLoading || eq.isLoading) return <Centered><Spinner /><p>{t("loading")}</p></Centered>;
  if (jq.error || eq.error || !jq.data)
    return <Centered><p>{t("errorGeneric")}</p><button className="rounded-full bg-primary px-5 py-2 text-primary-foreground" onClick={() => { jq.refetch(); eq.refetch(); }}>{t("retry")}</button></Centered>;

  const start = jq.data.start_date;
  const cur = currentDay(start, today);
  const raw = rawDay(start, today);
  const pct = Math.round((completed.size / TOTAL_DAYS) * 100);

  // Month navigation across the journey's real Gregorian months
  const [sy, sm] = parseISO(start);
  const end = dateForDay(start, TOTAL_DAYS);
  const [ey, em] = parseISO(end);
  const totalMonths = (ey - sy) * 12 + (em - sm) + 1;
  const [ty, tm] = parseISO(today);
  const defaultOffset = Math.min(totalMonths - 1, Math.max(0, (ty - sy) * 12 + (tm - sm)));
  const off = monthOffset ?? defaultOffset;
  const mDate = new Date(Date.UTC(sy, sm - 1 + off, 1));
  const y = mDate.getUTCFullYear();
  const m = mDate.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const firstWeekday = mDate.getUTCDay();
  const monthLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-ca-gregory" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(mDate);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i))),
  );

  return (
    <div className="space-y-6">
      <section className="paper-card overflow-hidden p-6">
        <p className="text-sm text-muted-foreground">{formatDate(today, lang)}</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">{t("journeyDay")}</p>
            <p className="font-display text-4xl font-bold text-primary">{formatNumber(cur, lang)}<span className="text-base font-normal text-muted-foreground"> / {formatNumber(TOTAL_DAYS, lang)}</span></p>
          </div>
          <div className="rounded-xl bg-accent/60 p-4">
            <p className="text-xs text-muted-foreground">{t("completedEntries")}</p>
            <p className="font-display text-4xl font-bold text-primary">{formatNumber(completed.size, lang)}<span className="text-base font-normal text-muted-foreground"> / {formatNumber(TOTAL_DAYS, lang)}</span></p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-sage to-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        {raw > TOTAL_DAYS && <p className="mt-3 text-sm text-sage">{t("journeyEnded")}</p>}
        <button onClick={() => navigate({ to: "/day/$dayNumber", params: { dayNumber: String(cur) } })} className="mt-5 w-full rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-soft">
          {t("openToday")} · {t("day")} {formatNumber(cur, lang)}
        </button>
      </section>

      <section className="paper-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <button disabled={off <= 0} onClick={() => setMonthOffset(off - 1)} className="rounded-full px-3 py-1 text-xl text-primary disabled:opacity-30" aria-label={t("prev")}>{lang === "ar" ? "›" : "‹"}</button>
          <h2 className="text-2xl font-semibold text-primary">{monthLabel}</h2>
          <button disabled={off >= totalMonths - 1} onClick={() => setMonthOffset(off + 1)} className="rounded-full px-3 py-1 text-xl text-primary disabled:opacity-30" aria-label={t("next")}>{lang === "ar" ? "‹" : "›"}</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdays.map((w, i) => <div key={i} className="pb-1 text-xs text-muted-foreground">{w}</div>)}
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const dn = dayForDate(start, iso);
            const label = formatNumber(i + 1, lang);
            if (!dn) return <div key={iso} className="aspect-square rounded-lg p-1 text-sm text-muted-foreground/40">{label}</div>;
            const future = dn > raw;
            const isCur = dn === cur && raw <= TOTAL_DAYS;
            const done = completed.has(dn);
            const cls = done
              ? "bg-sage/70 text-plum"
              : isCur
                ? "bg-primary text-primary-foreground ring-2 ring-gold"
                : future
                  ? "bg-muted/60 text-muted-foreground/60"
                  : started.has(dn) ? "bg-lavender/60 text-plum" : "bg-paper text-plum border";
            const inner = (
              <div className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${cls}`}>
                <span className="font-semibold">{label}</span>
                <span className="text-[9px] opacity-70">{future ? "🔒" : formatNumber(dn, lang)}</span>
              </div>
            );
            return future ? <div key={iso} title={t("locked")}>{inner}</div> : (
              <Link key={iso} to="/day/$dayNumber" params={{ dayNumber: String(dn) }} className="transition hover:scale-105">{inner}</Link>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-sage/70" />{t("completed")}</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-primary" />{t("current")}</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-muted" />{t("upcoming")}</span>
        </div>
      </section>
    </div>
  );
}
