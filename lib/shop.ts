import { t } from "./format";
import type { Lang } from "./types";

export const LOCAL_DELIVERY_CENTS = 600;

export const shop = {
  name: "Sweetbites",
  street: "195 Lougheed Close",
  cityLine: "Red Deer, AB T4R 3G7",
  country: "Canada",
  phoneDisplay: "+1 416 555 0100",
  phoneTel: "tel:+14165550100",
  whatsapp: "https://wa.me/14165550100",
  instagram: "https://www.instagram.com/sweetbites.rd/",
  facebook: "https://www.facebook.com/sweetbites.rd",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=195+Lougheed+Close,+Red+Deer,+AB+T4R+3G7",
} as const;

export function mapsSearchUrls(query: string) {
  const q = query.trim();
  if (!q) {
    return { google: "https://www.google.com/maps", apple: "https://maps.apple.com" };
  }
  const enc = encodeURIComponent(q);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${enc}`,
    apple: `https://maps.apple.com/?q=${enc}`,
  };
}

export function localDateIso(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const WANTED_ON_RE = /^\d{4}-\d{2}-\d{2}$/;

export function wantedNote(
  fulfillment: "pickup" | "ship",
  wantedOn: string,
  notes: string | undefined,
  lang: Lang,
) {
  const line =
    fulfillment === "ship"
      ? t(`Ship date: ${wantedOn}`, `Fecha de envío: ${wantedOn}`, lang)
      : t(`Pickup date: ${wantedOn}`, `Fecha de recogida: ${wantedOn}`, lang);
  const extra = notes?.trim();
  return extra ? `${line}\n${extra}` : line;
}

export function wantedOnFromNotes(notes?: string | null) {
  const match = notes?.match(
    /(?:Pickup date|Ship date|Fecha de recogida|Fecha de envío):\s*(\d{4}-\d{2}-\d{2})/i,
  );
  return match?.[1];
}

const DAY_NAMES: Record<number, { en: string; es: string }> = {
  0: { en: "Sunday", es: "Domingo" },
  1: { en: "Monday", es: "Lunes" },
  2: { en: "Tuesday", es: "Martes" },
  3: { en: "Wednesday", es: "Miércoles" },
  4: { en: "Thursday", es: "Jueves" },
  5: { en: "Friday", es: "Viernes" },
  6: { en: "Saturday", es: "Sábado" },
};

const HOURS_BY_DAY: Record<number, { en: string; es: string }> = {
  0: { en: "10am – 3pm", es: "10am – 3pm" },
  1: { en: "8am – 6pm", es: "8am – 6pm" },
  2: { en: "8am – 6pm", es: "8am – 6pm" },
  3: { en: "8am – 6pm", es: "8am – 6pm" },
  4: { en: "8am – 6pm", es: "8am – 6pm" },
  5: { en: "8am – 6pm", es: "8am – 6pm" },
  6: { en: "9am – 5pm", es: "9am – 5pm" },
};

export function shopAddressLine(): string {
  return `${shop.street}, ${shop.cityLine}`;
}

export function todayHoursLine(lang: Lang): string {
  const day = new Date().getDay();
  const name = DAY_NAMES[day][lang];
  const hours = HOURS_BY_DAY[day][lang];
  return `${name}: ${hours}`;
}

export function allHoursLines(lang: Lang): string[] {
  return [
    t("Mon–Fri: 8am – 6pm", "Lun–Vie: 8am – 6pm", lang),
    t("Sat: 9am – 5pm", "Sáb: 9am – 5pm", lang),
    t("Sun: 10am – 3pm", "Dom: 10am – 3pm", lang),
  ];
}
