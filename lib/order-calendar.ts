import { getSupabaseBrowser } from "./supabase-browser";
import { localDateIso, WANTED_ON_RE } from "./shop";

export type OrderCalendarBody = {
  blocked_dates: string[];
};

export const DEFAULT_ORDER_CALENDAR: OrderCalendarBody = { blocked_dates: [] };

export function normalizeOrderCalendarBody(body: unknown): OrderCalendarBody {
  if (!body || typeof body !== "object") return DEFAULT_ORDER_CALENDAR;
  const raw = (body as OrderCalendarBody).blocked_dates;
  if (!Array.isArray(raw)) return DEFAULT_ORDER_CALENDAR;
  const blocked_dates = raw
    .filter((d): d is string => typeof d === "string" && WANTED_ON_RE.test(d))
    .sort();
  return { blocked_dates: [...new Set(blocked_dates)] };
}

export async function fetchOrderCalendarBrowser(): Promise<OrderCalendarBody> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return DEFAULT_ORDER_CALENDAR;
  const { data } = await supabase.from("site_pages").select("body").eq("slug", "order-calendar").maybeSingle();
  return normalizeOrderCalendarBody(data?.body);
}

export function isBlockedOrderDate(iso: string, blocked: string[]): boolean {
  return blocked.includes(iso);
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive local calendar days from `from` through `to` (YYYY-MM-DD). Empty if invalid or reversed. */
export function isoDatesInRange(from: string, to: string): string[] {
  if (!WANTED_ON_RE.test(from) || !WANTED_ON_RE.test(to) || from > to) return [];
  const out: string[] = [];
  const cur = parseIsoLocal(from);
  const end = parseIsoLocal(to);
  // ponytail: cap 366 days per range; raise MAX_RANGE_DAYS if you need longer blocks
  for (let i = 0; i < 366 && cur <= end; i++) {
    out.push(localDateIso(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function mergeBlockedDates(existing: string[], add: string[]): string[] {
  const valid = add.filter((d) => WANTED_ON_RE.test(d));
  return [...new Set([...existing, ...valid])].sort();
}

export type BlockedDateRange = { from: string; to: string; dates: string[] };

/** Collapse sorted blocked days into consecutive ranges for display. */
export function groupBlockedDatesIntoRanges(blocked: string[]): BlockedDateRange[] {
  const sorted = [...new Set(blocked.filter((d) => WANTED_ON_RE.test(d)))].sort();
  if (sorted.length === 0) return [];

  const ranges: BlockedDateRange[] = [];
  let from = sorted[0];
  let to = sorted[0];
  let dates = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const iso = sorted[i];
    const nextOfPrev = parseIsoLocal(to);
    nextOfPrev.setDate(nextOfPrev.getDate() + 1);
    if (localDateIso(nextOfPrev) === iso) {
      to = iso;
      dates.push(iso);
    } else {
      ranges.push({ from, to, dates });
      from = iso;
      to = iso;
      dates = [iso];
    }
  }
  ranges.push({ from, to, dates });
  return ranges;
}

export function blockedRangeKey(range: BlockedDateRange): string {
  return `${range.from}/${range.to}`;
}

export function formatOrderCalendarDate(iso: string, lang: "en" | "es"): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "es" ? "es-CA" : "en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatBlockedRangeSummary(range: BlockedDateRange, lang: "en" | "es"): string {
  if (range.from === range.to) return formatOrderCalendarDate(range.from, lang);
  return `${formatOrderCalendarDate(range.from, lang)} – ${formatOrderCalendarDate(range.to, lang)}`;
}
