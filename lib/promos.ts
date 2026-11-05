import { getSupabase } from "./supabase";
import { getSupabaseAdmin } from "./supabase-admin";

function promoSupabase() {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return getSupabase();
}

export type PromoKind = "percent" | "fixed";

export type PromoCode = {
  code: string;
  kind: PromoKind;
  value: number;
  minFoodCents: number;
  active: boolean;
  expiresAt: string | null;
};

export type PromoQuote =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: "invalid" | "min_order"; minFoodCents?: number };

export const LOCAL_PROMOS: PromoCode[] = [
  { code: "SWEET10", kind: "percent", value: 10, minFoodCents: 0, active: true, expiresAt: null },
  { code: "BITE5", kind: "fixed", value: 500, minFoodCents: 2500, active: true, expiresAt: null },
];

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function quotePromo(
  promo: PromoCode | null,
  foodCents: number,
  now = Date.now(),
): PromoQuote {
  if (!promo || !promo.active) return { ok: false, error: "invalid" };
  if (promo.expiresAt && Date.parse(promo.expiresAt) <= now) {
    return { ok: false, error: "invalid" };
  }
  if (foodCents < promo.minFoodCents) {
    return { ok: false, error: "min_order", minFoodCents: promo.minFoodCents };
  }
  const raw =
    promo.kind === "percent" ? Math.round((foodCents * promo.value) / 100) : promo.value;
  return {
    ok: true,
    code: promo.code,
    discountCents: Math.min(Math.max(foodCents, 0), Math.max(0, raw)),
  };
}

export function findLocalPromo(code: string): PromoCode | null {
  const normalized = normalizePromoCode(code);
  return LOCAL_PROMOS.find((p) => p.code === normalized) ?? null;
}

export async function lookupPromo(raw: string): Promise<PromoCode | null> {
  const code = normalizePromoCode(raw);
  if (!code) return null;

  const supabase = promoSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("promo_codes")
      .select("code, kind, value, min_food_cents, active, expires_at")
      .eq("code", code)
      .maybeSingle();
    if (!data) return null;
    return {
      code: data.code,
      kind: data.kind,
      value: data.value,
      minFoodCents: data.min_food_cents,
      active: data.active,
      expiresAt: data.expires_at,
    };
  }

  return findLocalPromo(code);
}

export async function quotePromoCode(raw: string, foodCents: number): Promise<PromoQuote> {
  if (!normalizePromoCode(raw)) return { ok: false, error: "invalid" };
  return quotePromo(await lookupPromo(raw), foodCents);
}
