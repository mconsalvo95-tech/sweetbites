import { getSupabaseServer } from "./supabase-server";
import { DEFAULT_ORDER_CALENDAR, normalizeOrderCalendarBody, type OrderCalendarBody } from "./order-calendar";

export async function fetchOrderCalendarServer(): Promise<OrderCalendarBody> {
  const supabase = await getSupabaseServer();
  if (!supabase) return DEFAULT_ORDER_CALENDAR;
  const { data } = await supabase.from("site_pages").select("body").eq("slug", "order-calendar").maybeSingle();
  return normalizeOrderCalendarBody(data?.body);
}
