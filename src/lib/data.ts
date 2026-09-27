import { supabase } from "./supabase";
import { dateForDay, todayLocalISO } from "./journey";

export type Journey = { id: string; user_id: string; start_date: string };
export type Profile = { user_id: string; display_name: string | null; avatar_url: string | null; preferred_language: "ar" | "en" };
export type Entry = {
  id: string;
  user_id: string;
  journey_id: string;
  day_number: number;
  entry_date: string;
  god_attribute: string | null;
  sin_to_avoid: string | null;
  commandment_to_follow: string | null;
  privilege_to_thank: string | null;
  promise_to_hold: string | null;
  example_to_follow: string | null;
  prayer_response: string | null;
  other_reflections: string | null;
  memory_verse: string | null;
  scripture_reference: string | null;
  is_completed: boolean;
};
export type PrayerRequest = { id: string; journal_entry_id: string; request_text: string; response_date: string | null };

export const TEXT_FIELDS = [
  "god_attribute", "sin_to_avoid", "commandment_to_follow", "privilege_to_thank", "promise_to_hold",
  "example_to_follow", "prayer_response", "other_reflections", "memory_verse", "scripture_reference",
] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

async function uid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user;
}

/** Idempotent bootstrap: ensures profile + journey exist. start_date is set once, never overwritten. */
export async function bootstrapUser(preferredLanguage: "ar" | "en") {
  const user = await uid();
  const meta = user.user_metadata ?? {};
  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: meta.full_name ?? meta.name ?? user.email ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      preferred_language: preferredLanguage,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  const { error } = await supabase
    .from("journeys")
    .upsert({ user_id: user.id, start_date: todayLocalISO() }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function getJourney(): Promise<Journey> {
  const user = await uid();
  const { data, error } = await supabase.from("journeys").select("id,user_id,start_date").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return data as Journey;
  await bootstrapUser("ar");
  const again = await supabase.from("journeys").select("id,user_id,start_date").eq("user_id", user.id).single();
  if (again.error) throw again.error;
  return again.data as Journey;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await uid();
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateLanguage(lang: "ar" | "en") {
  const user = await uid();
  await supabase.from("profiles").update({ preferred_language: lang }).eq("user_id", user.id);
}

export async function listEntrySummaries(): Promise<Pick<Entry, "day_number" | "is_completed">[]> {
  const user = await uid();
  const { data, error } = await supabase.from("journal_entries").select("day_number,is_completed").eq("user_id", user.id);
  if (error) throw error;
  return data ?? [];
}

export async function getEntry(day: number): Promise<{ entry: Entry | null; requests: PrayerRequest[] }> {
  const user = await uid();
  const { data, error } = await supabase.from("journal_entries").select("*").eq("user_id", user.id).eq("day_number", day).maybeSingle();
  if (error) throw error;
  if (!data) return { entry: null, requests: [] };
  const r = await supabase
    .from("prayer_requests")
    .select("id,journal_entry_id,request_text,response_date")
    .eq("user_id", user.id)
    .eq("journal_entry_id", data.id)
    .order("created_at");
  if (r.error) throw r.error;
  return { entry: data as Entry, requests: (r.data ?? []) as PrayerRequest[] };
}

/** Upsert an entry; entry_date is always derived from the journey start date. */
export async function saveEntry(journey: Journey, day: number, patch: Partial<Entry>): Promise<Entry> {
  const user = await uid();
  const { data, error } = await supabase
    .from("journal_entries")
    .upsert(
      { ...patch, user_id: user.id, journey_id: journey.id, day_number: day, entry_date: dateForDay(journey.start_date, day) },
      { onConflict: "user_id,day_number" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function addRequest(entryId: string, text: string): Promise<PrayerRequest> {
  const user = await uid();
  const { data, error } = await supabase
    .from("prayer_requests")
    .insert({ user_id: user.id, journal_entry_id: entryId, request_text: text })
    .select("id,journal_entry_id,request_text,response_date")
    .single();
  if (error) throw error;
  return data as PrayerRequest;
}

export async function updateRequest(id: string, patch: Partial<PrayerRequest>) {
  const user = await uid();
  const { error } = await supabase.from("prayer_requests").update(patch).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

export async function deleteRequest(id: string) {
  const user = await uid();
  const { error } = await supabase.from("prayer_requests").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

export type SearchHit = { day_number: number; entry_date: string; snippet: string };

export async function searchJournal(q: string): Promise<SearchHit[]> {
  const user = await uid();
  const term = q.trim().replace(/[%_,()*\\]/g, " ").trim();
  if (!term) return [];
  const like = `%${term}%`;
  const or = TEXT_FIELDS.map((f) => `${f}.ilike.${like}`).join(",");
  const [e, r] = await Promise.all([
    supabase.from("journal_entries").select("*").eq("user_id", user.id).or(or).order("day_number").limit(100),
    supabase
      .from("prayer_requests")
      .select("request_text, journal_entries!inner(day_number,entry_date)")
      .eq("user_id", user.id)
      .ilike("request_text", like)
      .limit(100),
  ]);
  if (e.error) throw e.error;
  if (r.error) throw r.error;
  const hits = new Map<number, SearchHit>();
  const lower = term.toLowerCase();
  for (const row of (e.data ?? []) as Entry[]) {
    const field = TEXT_FIELDS.find((f) => (row[f] ?? "").toLowerCase().includes(lower));
    hits.set(row.day_number, { day_number: row.day_number, entry_date: row.entry_date, snippet: field ? (row[field] as string) : "" });
  }
  for (const row of (r.data ?? []) as unknown as { request_text: string; journal_entries: { day_number: number; entry_date: string } }[]) {
    const je = row.journal_entries;
    if (!hits.has(je.day_number)) hits.set(je.day_number, { day_number: je.day_number, entry_date: je.entry_date, snippet: row.request_text });
  }
  return [...hits.values()].sort((a, b) => a.day_number - b.day_number);
}
