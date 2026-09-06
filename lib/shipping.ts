import type { ShippingService } from "./types";

const ORIGIN_POSTAL = "M5V 2T6";

// ponytail: flat mock rates by service code; upgrade path = CPC Get Rates API (phase 2)
export function getMockShippingRates(destPostal: string): ShippingService[] {
  const zone = destPostal.trim().charAt(0).toUpperCase();
  const isLocal = zone === "M" || zone === "L";
  const isWest = zone === "V" || zone === "T" || zone === "S" || zone === "R";

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

export function getOriginPostal(): string {
  return ORIGIN_POSTAL;
}
