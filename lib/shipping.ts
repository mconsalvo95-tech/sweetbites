import { fetchCatalog } from "./catalog";
import { cpcEnabled, cpcGetRates, type CpcQuote } from "./cpc";
import { normalizePostal } from "./format";
import { shop } from "./shop";
import type { ShippingService } from "./types";

const DOMESTIC: Record<string, { nameEn: string; nameEs: string }> = {
  "DOM.RP": { nameEn: "Regular Parcel", nameEs: "Paquete regular" },
  "DOM.EP": { nameEn: "Expedited Parcel", nameEs: "Paquete acelerado" },
  "DOM.XP": { nameEn: "Xpresspost", nameEs: "Xpresspost" },
  "DOM.PC": { nameEn: "Priority", nameEs: "Prioridad" },
};

function compactPostal(code: string) {
  return code.toUpperCase().replace(/\s/g, "");
}

export function getOriginPostal(): string {
  const fromEnv = process.env.CPC_ORIGIN_POSTAL?.trim();
  if (fromEnv) return compactPostal(fromEnv);
  const fromShop = shop.cityLine.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/i);
  return compactPostal(fromShop?.[0] ?? "T4R3G7");
}

export function getMockShippingRates(destPostal: string): ShippingService[] {
  const zone = destPostal.trim().charAt(0).toUpperCase();
  const isLocal = zone === "T";
  const isWest = zone === "V" || zone === "S" || zone === "R";
  const base = isLocal ? 899 : isWest ? 1499 : 1199;

  return [
    {
      code: "regular",
      nameEn: "Regular Parcel",
      nameEs: "Paquete regular",
      rateCents: base,
      etaEn: isLocal ? "3–5 business days" : "5–8 business days",
      etaEs: isLocal ? "3–5 días hábiles" : "5–8 días hábiles",
    },
    {
      code: "expedited",
      nameEn: "Expedited Parcel",
      nameEs: "Paquete acelerado",
      rateCents: base + 500,
      etaEn: isLocal ? "2–3 business days" : "3–5 business days",
      etaEs: isLocal ? "2–3 días hábiles" : "3–5 días hábiles",
    },
    {
      code: "xpresspost",
      nameEn: "Xpresspost",
      nameEs: "Xpresspost",
      rateCents: base + 900,
      etaEn: isLocal ? "1–2 business days" : "2–4 business days",
      etaEs: isLocal ? "1–2 días hábiles" : "2–4 días hábiles",
    },
  ];
}

export function parsePriceQuotes(quotes: CpcQuote[]): ShippingService[] {
  return quotes
    .filter((q) => q.serviceCode && DOMESTIC[q.serviceCode] && typeof q.priceDetails?.due === "number")
    .map((q) => {
      const names = DOMESTIC[q.serviceCode!];
      const days = q.serviceStandard?.expectedTransitTime;
      const eta = typeof days === "number" ? `${days} business day${days === 1 ? "" : "s"}` : names.nameEn;
      const etaEs = typeof days === "number" ? `${days} día${days === 1 ? "" : "s"} hábil${days === 1 ? "" : "es"}` : names.nameEs;
      return {
        code: q.serviceCode!,
        nameEn: q.serviceName || names.nameEn,
        nameEs: names.nameEs,
        rateCents: Math.round(q.priceDetails!.due! * 100),
        etaEn: eta,
        etaEs,
      };
    });
}

type Parcel = { weightKg: number; lengthCm: number; widthCm: number; heightCm: number };

type ShipItem = { productId: string; qty: number };

async function parcelFor(items: ShipItem[]): Promise<Parcel> {
  const { products } = await fetchCatalog();
  let grams = 0;
  let length = 1;
  let width = 1;
  let height = 0;
  for (const line of items) {
    const product = products.find((p) => p.id === line.productId);
    const g = product?.shipWeightG || 200;
    const l = product?.shipLCm || 20;
    const w = product?.shipWCm || 15;
    const h = product?.shipHCm || 8;
    grams += g * line.qty;
    length = Math.max(length, l);
    width = Math.max(width, w);
    height += h * line.qty;
  }
  // ponytail: one combined box (sum height); upgrade = real packing / multi-piece
  return {
    weightKg: Math.max(0.1, Math.round((grams / 1000) * 1000) / 1000),
    lengthCm: Math.round(length),
    widthCm: Math.round(width),
    heightCm: Math.max(1, Math.round(height)),
  };
}

export type ShippingQuote = { rates: ShippingService[]; source: "cpc" | "mock" };

export async function getShippingRates(
  destPostal: string,
  items: ShipItem[],
): Promise<ShippingQuote> {
  const postal = compactPostal(destPostal);
  if (cpcEnabled()) {
    if (!items.length) throw new Error("Shipping quote unavailable");
    try {
      const parcel = await parcelFor(items);
      const quotes = await cpcGetRates({
        originPostal: getOriginPostal(),
        destPostal: postal,
        ...parcel,
      });
      const rates = parsePriceQuotes(quotes);
      if (rates.length) return { rates, source: "cpc" };
    } catch (err) {
      console.warn("CPC Get Rates failed", err instanceof Error ? err.message : err);
    }
    throw new Error("Shipping quote unavailable");
  }
  return { rates: getMockShippingRates(normalizePostal(destPostal)), source: "mock" };
}

export async function resolveShipRate(input: {
  destPostal?: string;
  serviceCode?: string;
  items: ShipItem[];
}): Promise<ShippingService> {
  if (!input.destPostal || !input.serviceCode) {
    throw new Error("Select a shipping option");
  }
  const { rates } = await getShippingRates(input.destPostal, input.items);
  const match = rates.find((r) => r.code === input.serviceCode);
  if (!match) throw new Error("Select a shipping option");
  return match;
}
