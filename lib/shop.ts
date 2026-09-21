import { t } from "./format";
import type { Lang } from "./types";

export const LOCAL_DELIVERY_CENTS = 600;

export const shop = {
  name: "Sweetbites Toronto",
  street: "124 King Street W",
  cityLine: "Toronto, ON M5V 2T6",
  country: "Canada",
  phoneDisplay: "+1 416 555 0100",
  phoneTel: "tel:+14165550100",
  whatsapp: "https://wa.me/14165550100",
  instagram: "https://www.instagram.com/sweetbites.rd/",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=124+King+Street+W,+Toronto,+ON+M5V+2T6",
} as const;

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
