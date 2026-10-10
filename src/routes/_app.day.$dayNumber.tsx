import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addRequest, deleteRequest, getEntry, getJourney, saveEntry, updateRequest,
  type Entry, type Journey, type PrayerRequest, type TextField,
} from "@/lib/data";
import { useI18n, type Key } from "@/lib/i18n";
import { TOTAL_DAYS, dateForDay, formatDate, formatNumber, isDayUnlocked } from "@/lib/journey";
import { Centered, Spinner } from "@/components/Shell";
import { PageTitle, ParchmentPage, RuledText, SectionTitle } from "@/components/Ornate";

export const Route = createFileRoute("/_app/day/$dayNumber")({
  head: ({ params }) => ({ meta: [{ title: `Day ${params.dayNumber} | Khalwety` }, { name: "description", content: "Daily spiritual journal page." }] }),
  component: DayPage,
});

function DayPage() {
  const { dayNumber } = Route.useParams();
  const { t, lang } = useI18n();
  const day = Number(dayNumber);
  const jq = useQuery({ queryKey: ["journey"], queryFn: getJourney });

  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) return <Centered><p>{t("notFoundDay")}</p><Link to="/home" className="text-primary underline">{t("back")}</Link></Centered>;
  if (jq.isLoading) return <Centered><Spinner /></Centered>;
  if (jq.error || !jq.data) return <Centered><p>{t("errorGeneric")}</p><button onClick={() => jq.refetch()} className="rounded-full bg-primary px-5 py-2 text-primary-foreground">{t("retry")}</button></Centered>;

  const journey = jq.data;
  const date = dateForDay(journey.start_date, day);
  const unlocked = isDayUnlocked(journey.start_date, day);

  return (
    <div className="space-y-5">
      <DayHeader journey={journey} day={day} />
      {unlocked ? (
        <Editor key={day} journey={journey} day={day} />
      ) : (
        <ParchmentPage>
          <PageTitle>{t("dayTitle")}</PageTitle>
          <div className="py-10 text-center">
            <p className="text-4xl">🔒</p>
            <h2 className="mt-3 text-2xl text-ink">{t("locked")}</h2>
            <p className="mt-2 text-muted-foreground">{t("lockedSub")} {formatDate(date, lang)}</p>
          </div>
        </ParchmentPage>
      )}
    </div>
  );
}

function DayHeader({ journey, day }: { journey: Journey; day: number }) {
  const { t, lang } = useI18n();
  const short: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const pill = "rounded-full border border-gold/50 bg-paper/80 px-3 py-1.5 text-ink shadow-sm hover:bg-secondary";
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      {day > 1 ? (
        <Link to="/day/$dayNumber" params={{ dayNumber: String(day - 1) }} className={pill}>
          {lang === "ar" ? "→" : "←"} {formatDate(dateForDay(journey.start_date, day - 1), lang, short)}
        </Link>
      ) : <span />}
      <Link to="/home" className="text-center leading-tight">
        <span className="block text-xs text-gold-deep">{t("day")} {formatNumber(day, lang)} {t("of")} {formatNumber(TOTAL_DAYS, lang)}</span>
        <span className="text-muted-foreground underline-offset-4 hover:underline">{t("back")}</span>
      </Link>
      {day < TOTAL_DAYS ? (
        <Link to="/day/$dayNumber" params={{ dayNumber: String(day + 1) }} className={pill}>
          {formatDate(dateForDay(journey.start_date, day + 1), lang, short)} {lang === "ar" ? "←" : "→"}
        </Link>
      ) : <span />}
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function Editor({ journey, day }: { journey: Journey; day: number }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const eq = useQuery({ queryKey: ["entry", day], queryFn: () => getEntry(day), staleTime: 0 });
  const [form, setForm] = useState<Partial<Entry> | null>(null);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [state, setState] = useState<SaveState>("idle");
  const entryIdRef = useRef<string | null>(null);
  const pending = useRef<Partial<Entry>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reqPending = useRef<Record<string, Partial<PrayerRequest>>>({});

  useEffect(() => {
    if (eq.data && form === null) {
      setForm(eq.data.entry ?? {});
      setRequests(eq.data.requests);
      entryIdRef.current = eq.data.entry?.id ?? null;
    }
  }, [eq.data, form]);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const patch = pending.current;
    if (!Object.keys(patch).length) return entryIdRef.current;
    pending.current = {};
    setState("saving");
    try {
      const saved = await saveEntry(journey, day, patch);
      entryIdRef.current = saved.id;
      setState("saved");
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.setQueryData(["entry", day], (old: { requests: PrayerRequest[] } | undefined) => ({ entry: saved, requests: old?.requests ?? [] }));
      return saved.id;
    } catch (e) {
      console.error(e);
      pending.current = { ...patch, ...pending.current };
      setState("error");
      return null;
    }
  }, [journey, day, qc]);

  const flushRequests = useCallback(async () => {
    const entries = Object.entries(reqPending.current);
    reqPending.current = {};
    Object.values(reqTimers.current).forEach(clearTimeout);
    reqTimers.current = {};
    for (const [id, patch] of entries) {
      try { await updateRequest(id, patch); } catch { setState("error"); }
    }
  }, []);

  // Save pending edits when leaving the page or navigating away
  useEffect(() => {
    const onHide = () => { void flush(); void flushRequests(); };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      onHide();
    };
  }, [flush, flushRequests]);

  const update = (patch: Partial<Entry>, immediate = false) => {
    setForm((f) => ({ ...f, ...patch }));
    pending.current = { ...pending.current, ...patch };
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void flush();
    else timer.current = setTimeout(() => void flush(), 900);
  };

  const onAddRequest = async () => {
    setState("saving");
    let id = entryIdRef.current;
    if (!id) { pending.current = { ...pending.current }; pending.current.is_completed ??= form?.is_completed ?? false; id = await flush(); }
    if (!id) return;
    try {
      const r = await addRequest(id, " ");
      setRequests((rs) => [...rs, { ...r, request_text: "" }]);
      setState("saved");
    } catch { setState("error"); }
  };

  const onEditRequest = (id: string, patch: Partial<PrayerRequest>) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    reqPending.current[id] = { ...reqPending.current[id], ...patch, ...(patch.request_text !== undefined ? { request_text: patch.request_text || " " } : {}) };
    setState("saving");
    clearTimeout(reqTimers.current[id]);
    reqTimers.current[id] = setTimeout(async () => {
      const p = reqPending.current[id];
      delete reqPending.current[id];
      if (!p) return;
      try { await updateRequest(id, p); setState("saved"); } catch { setState("error"); }
    }, 900);
  };

  const onDeleteRequest = async (id: string) => {
    clearTimeout(reqTimers.current[id]);
    delete reqPending.current[id];
    setRequests((rs) => rs.filter((r) => r.id !== id));
    try { await deleteRequest(id); setState("saved"); } catch { setState("error"); }
  };

  if (eq.isLoading || !form) return <Centered><Spinner /></Centered>;
  if (eq.error) return <Centered><p>{t("errorGeneric")}</p></Centered>;

  const text = (k: TextField) => (form[k] as string) ?? "";
  const line = (k: TextField, label: Key) => (
    <label className="flex items-end gap-2">
      <span className="shrink-0 pb-1.5 text-[0.95rem] font-bold text-ink">{t(label)} :</span>
      <RuledText value={text(k)} onChange={(e) => update({ [k]: e.target.value })} />
    </label>
  );
  const date = dateForDay(journey.start_date, day);

  return (
    <div className="space-y-4">
      <SaveBadge state={state} onRetry={() => void flush()} />

      <ParchmentPage>
        <PageTitle>{t("dayTitle")}</PageTitle>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <p className="pb-1.5 font-bold text-ink">
            {t("dateLabel")} : <span className="font-normal">{formatDate(date, lang)}</span>
          </p>
          <label className="flex flex-1 items-end gap-2 sm:max-w-[55%]">
            <span className="shrink-0 pb-1.5 font-bold text-ink">{t("readingRef")} :</span>
            <RuledText value={text("reading_reference")} onChange={(e) => update({ reading_reference: e.target.value })} />
          </label>
        </div>

        <div className="mt-7 space-y-8">
          <section>
            <SectionTitle title={t("q1")} sub={t("q1Sub")} />
            <RuledText minRows={2} value={text("god_attribute")} onChange={(e) => update({ god_attribute: e.target.value })} />
          </section>

          <section>
            <SectionTitle title={t("q2")} />
            <div className="space-y-1">
              {line("sin_to_avoid", "sin")}
              {line("commandment_to_follow", "command")}
              {line("privilege_to_thank", "privilege")}
              {line("promise_to_hold", "promise")}
              {line("example_to_follow", "example")}
            </div>
          </section>

          <section>
            <SectionTitle title={t("q3")} sub={t("q3Sub")} />
            <RuledText minRows={4} value={text("prayer_response")} onChange={(e) => update({ prayer_response: e.target.value })} />
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="font-body text-xl font-bold text-ink sm:text-2xl">{t("requests")} :</h2>
              <p className="text-xs text-muted-foreground">{t("requestsHint")}</p>
            </div>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-end gap-2">
                  <RuledText
                    placeholder={t("requestText")}
                    value={r.request_text.trim() === "" ? "" : r.request_text}
                    onChange={(e) => onEditRequest(r.id, { request_text: e.target.value })}
                  />
                  <input
                    type="date"
                    aria-label={t("responseDate")}
                    title={t("responseDate")}
                    className="mb-1 w-[8.5rem] shrink-0 rounded-lg border border-gold/50 bg-paper/80 px-1.5 py-1 text-xs text-ink"
                    value={r.response_date ?? ""}
                    onChange={(e) => onEditRequest(r.id, { response_date: e.target.value || null })}
                  />
                  <button onClick={() => onDeleteRequest(r.id)} aria-label={t("remove")} className="mb-1 shrink-0 rounded-full px-2 text-lg leading-none text-destructive/80 hover:text-destructive">×</button>
                </div>
              ))}
              <button onClick={onAddRequest} className="mt-1 w-full rounded-xl border border-dashed border-gold py-2 text-sm font-semibold text-ink hover:bg-secondary/60">+ {t("addRequest")}</button>
            </div>
          </section>

          <section>
            <SectionTitle title={t("reflections")} sub={t("reflectionsHint")} />
            <RuledText minRows={4} value={text("other_reflections")} onChange={(e) => update({ other_reflections: e.target.value })} />
          </section>

          <section>
            <SectionTitle title={t("verse")} />
            <div className="relative rounded-2xl border-2 border-gold/80 bg-paper/60 px-8 py-4 shadow-[inset_0_0_0_4px_rgba(255,248,230,0.7),inset_0_0_0_5px_rgba(184,134,43,0.45)]">
              <span aria-hidden className="absolute start-2 top-1 font-display text-4xl text-gold-deep">“</span>
              <span aria-hidden className="absolute bottom-0 end-2 font-display text-4xl text-gold-deep">”</span>
              <RuledText minRows={2} className="font-display text-lg" value={text("memory_verse")} onChange={(e) => update({ memory_verse: e.target.value })} />
            </div>
            <label className="mx-auto mt-3 flex max-w-sm items-end gap-2">
              <span className="shrink-0 pb-1.5 font-bold text-ink">{t("reference")} :</span>
              <RuledText value={text("scripture_reference")} onChange={(e) => update({ scripture_reference: e.target.value })} />
            </label>
          </section>
        </div>
      </ParchmentPage>

      <label className="btn-gold flex cursor-pointer items-center justify-center gap-3 rounded-full p-4">
        <input type="checkbox" className="h-5 w-5 accent-[var(--gold-deep)]" checked={!!form.is_completed} onChange={(e) => update({ is_completed: e.target.checked }, true)} />
        <span className="font-display text-xl font-bold">{t("markDone")}</span>
      </label>
    </div>
  );
}

function SaveBadge({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const { t } = useI18n();
  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] z-40 flex justify-center [&_button]:pointer-events-auto">
      <span className={`rounded-full px-4 py-1 text-xs shadow-soft ${state === "error" ? "bg-destructive text-destructive-foreground" : state === "saved" ? "bg-sage text-white" : "bg-paper text-muted-foreground"}`}>
        {state === "saving" ? t("saving") : state === "saved" ? `✓ ${t("saved")}` : (
          <button onClick={onRetry}>{t("saveError")} · {t("retry")}</button>
        )}
      </span>
    </div>
  );
}
