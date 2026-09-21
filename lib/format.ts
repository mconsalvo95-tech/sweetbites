export function formatCad(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function t(en: string, es: string, lang: "en" | "es"): string {
  return lang === "es" ? es : en;
}

export function pickName(
  item: { nameEn: string; nameEs: string },
  lang: "en" | "es",
): string {
  return t(item.nameEn, item.nameEs, lang);
}

export function pickDesc(
  item: { descriptionEn: string; descriptionEs: string },
  lang: "en" | "es",
): string {
  return t(item.descriptionEn, item.descriptionEs, lang);
}

export function uid(): string {
  return crypto.randomUUID();
}

export const CANADIAN_POSTAL = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export function normalizePostal(code: string): string {
  const raw = code.toUpperCase().replace(/\s/g, "");
  return `${raw.slice(0, 3)} ${raw.slice(3)}`;
}

export function isValidCanadianPostal(code: string): boolean {
  return CANADIAN_POSTAL.test(code.trim());
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
