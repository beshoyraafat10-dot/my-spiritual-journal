export const TOTAL_DAYS = 365;

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function todayLocalISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDaysISO(iso: string, n: number): string {
  const t = new Date(toUTC(iso) + n * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86400000);
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function dateForDay(startDate: string, day: number): string {
  return addDaysISO(startDate, day - 1);
}

/** Raw (unclamped) elapsed day index; Day 1 = start date. */
export function rawDay(startDate: string, today = todayLocalISO()): number {
  return diffDays(today, startDate) + 1;
}

export function currentDay(startDate: string, today = todayLocalISO()): number {
  return clamp(rawDay(startDate, today), 1, TOTAL_DAYS);
}

export function dayForDate(startDate: string, iso: string): number | null {
  const n = diffDays(iso, startDate) + 1;
  return n >= 1 && n <= TOTAL_DAYS ? n : null;
}

export function isDayUnlocked(startDate: string, day: number, today = todayLocalISO()): boolean {
  return day <= rawDay(startDate, today);
}

export function formatDate(iso: string, lang: "ar" | "en", opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-ca-gregory" : "en-US", { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatNumber(n: number, lang: "ar" | "en") {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n);
}
