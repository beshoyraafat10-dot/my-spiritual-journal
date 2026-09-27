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
        <div className="paper-card p-10 text-center">
          <p className="text-4xl">🔒</p>
          <h2 className="mt-3 text-2xl text-primary">{t("locked")}</h2>
          <p className="mt-2 text-muted-foreground">{t("lockedSub")} {formatDate(date, lang)}</p>
        </div>
      )}
    </div>
  );
}

function DayHeader({ journey, day }: { journey: Journey; day: number }) {
  const { t, lang } = useI18n();
  const date = dateForDay(journey.start_date, day);
  const short: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return (
    <div className="paper-card p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-gold">{t("day")} {formatNumber(day, lang)} {t("of")} {formatNumber(TOTAL_DAYS, lang)}</p>
      <h1 className="mt-1 text-3xl font-semibold text-primary">{formatDate(date, lang)}</h1>
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        {day > 1 ? (
          <Link to="/day/$dayNumber" params={{ dayNumber: String(day - 1) }} className="rounded-full border px-3 py-1.5 text-primary hover:bg-secondary">
            {lang === "ar" ? "→" : "←"} {t("prev")} · {formatDate(dateForDay(journey.start_date, day - 1), lang, short)}
          </Link>
        ) : <span />}
        <Link to="/home" className="text-muted-foreground underline-offset-4 hover:underline">{t("back")}</Link>
        {day < TOTAL_DAYS ? (
          <Link to="/day/$dayNumber" params={{ dayNumber: String(day + 1) }} className="rounded-full border px-3 py-1.5 text-primary hover:bg-secondary">
            {formatDate(dateForDay(journey.start_date, day + 1), lang, short)} · {t("next")} {lang === "ar" ? "←" : "→"}
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function Editor({ journey, day }: { journey: Journey; day: number }) {
  const { t } = useI18n();
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

  const field = (k: TextField, label: Key, rows = 2, hint?: Key) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-plum">{t(label)}</span>
      <textarea rows={rows} className="field resize-y" placeholder={hint ? t(hint) : ""} value={(form[k] as string) ?? ""} onChange={(e) => update({ [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="space-y-5">
      <SaveBadge state={state} onRetry={() => void flush()} />

      <Section title={t("q1")} accent="bg-lavender">{field("god_attribute", "godAttr", 3)}</Section>

      <Section title={t("q2")} accent="bg-rose">
        <div className="space-y-4">
          {field("sin_to_avoid", "sin")}
          {field("commandment_to_follow", "command")}
          {field("privilege_to_thank", "privilege")}
          {field("promise_to_hold", "promise")}
          {field("example_to_follow", "example")}
        </div>
      </Section>

      <Section title={t("q3")} accent="bg-sage">
        <textarea rows={5} className="field resize-y" value={form.prayer_response ?? ""} onChange={(e) => update({ prayer_response: e.target.value })} />
      </Section>

      <Section title={t("requests")} accent="bg-gold">
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-paper p-3">
              <textarea rows={2} className="field resize-y bg-card" placeholder={t("requestText")} value={r.request_text.trim() === "" ? "" : r.request_text} onChange={(e) => onEditRequest(r.id, { request_text: e.target.value })} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  {t("responseDate")}
                  <input type="date" className="field w-auto bg-card py-1" value={r.response_date ?? ""} onChange={(e) => onEditRequest(r.id, { response_date: e.target.value || null })} />
                </label>
                <button onClick={() => onDeleteRequest(r.id)} className="text-destructive hover:underline">{t("remove")}</button>
              </div>
            </div>
          ))}
          <button onClick={onAddRequest} className="w-full rounded-xl border border-dashed border-gold py-2.5 text-sm font-medium text-plum hover:bg-secondary">+ {t("addRequest")}</button>
        </div>
      </Section>

      <Section title={t("reflections")} accent="bg-lavender">
        <textarea rows={4} className="field resize-y" placeholder={t("reflectionsHint")} value={form.other_reflections ?? ""} onChange={(e) => update({ other_reflections: e.target.value })} />
      </Section>

      <Section title={t("verse")} accent="bg-gold">
        <div className="space-y-3">
          <textarea rows={3} className="field resize-y font-display text-lg" value={form.memory_verse ?? ""} onChange={(e) => update({ memory_verse: e.target.value })} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-plum">{t("reference")}</span>
            <input className="field" value={form.scripture_reference ?? ""} onChange={(e) => update({ scripture_reference: e.target.value })} />
          </label>
        </div>
      </Section>

      <label className="paper-card flex cursor-pointer items-center justify-center gap-3 p-5">
        <input type="checkbox" className="h-5 w-5 accent-[var(--plum)]" checked={!!form.is_completed} onChange={(e) => update({ is_completed: e.target.checked }, true)} />
        <span className="font-display text-xl font-semibold text-primary">{t("markDone")}</span>
      </label>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="paper-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-6 w-1.5 rounded-full ${accent}`} />
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SaveBadge({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const { t } = useI18n();
  if (state === "idle") return null;
  return (
    <div className="sticky top-16 z-10 flex justify-center">
      <span className={`rounded-full px-4 py-1 text-xs shadow-soft ${state === "error" ? "bg-destructive text-destructive-foreground" : state === "saved" ? "bg-sage/80 text-plum" : "bg-card text-muted-foreground"}`}>
        {state === "saving" ? t("saving") : state === "saved" ? `✓ ${t("saved")}` : (
          <button onClick={onRetry}>{t("saveError")} · {t("retry")}</button>
        )}
      </span>
    </div>
  );
}
