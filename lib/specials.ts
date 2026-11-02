import { getSupabase } from "./supabase";

export type SpecialItem = {
  name_en: string;
  name_es: string;
  price_cents: number | null;
  note_en: string;
  note_es: string;
  image_url: string;
};

export type SpecialsTheme = "" | "christmas";

export type SpecialsBody = {
  enabled: boolean;
  theme: SpecialsTheme;
  starts_on: string;
  ends_on: string;
  title_en: string;
  title_es: string;
  message_en: string;
  message_es: string;
  image_url: string;
  items: SpecialItem[];
};

export const DEFAULT_SPECIALS: SpecialsBody = {
  enabled: false,
  theme: "",
  starts_on: "",
  ends_on: "",
  title_en: "",
  title_es: "",
  message_en: "",
  message_es: "",
  image_url: "",
  items: [],
};

export function mergeSpecialsBody(raw: unknown): SpecialsBody {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_SPECIALS };
  const patch = raw as Record<string, unknown>;
  const items = Array.isArray(patch.items)
    ? patch.items.map((row) => {
        if (!row || typeof row !== "object") return emptySpecialItem();
        const item = row as Record<string, unknown>;
        return {
          name_en: String(item.name_en ?? ""),
          name_es: String(item.name_es ?? ""),
          price_cents: typeof item.price_cents === "number" ? item.price_cents : null,
          note_en: String(item.note_en ?? ""),
          note_es: String(item.note_es ?? ""),
          image_url: String(item.image_url ?? ""),
        };
      })
    : [];
  const themeRaw = String(patch.theme ?? "");
  const theme: SpecialsTheme = themeRaw === "christmas" ? "christmas" : "";

  return {
    ...DEFAULT_SPECIALS,
    enabled: Boolean(patch.enabled),
    theme,
    starts_on: String(patch.starts_on ?? ""),
    ends_on: String(patch.ends_on ?? ""),
    title_en: String(patch.title_en ?? ""),
    title_es: String(patch.title_es ?? ""),
    message_en: String(patch.message_en ?? ""),
    message_es: String(patch.message_es ?? ""),
    image_url: String(patch.image_url ?? ""),
    items,
  };
}

export function emptySpecialItem(): SpecialItem {
  return { name_en: "", name_es: "", price_cents: null, note_en: "", note_es: "", image_url: "" };
}

/** Admin saves English only; mirror into ES fields for the Spanish site. */
export function mirrorSpecialsEnToEs(body: SpecialsBody): SpecialsBody {
  return {
    ...body,
    title_es: body.title_en,
    message_es: body.message_en,
    items: body.items.map((item) => ({
      ...item,
      name_es: item.name_en,
      note_es: item.note_en,
    })),
  };
}

export function specialIsVisible(
  cfg: Pick<SpecialsBody, "enabled" | "starts_on" | "ends_on">,
  todayIso: string,
): boolean {
  if (!cfg.enabled) return false;
  if (!cfg.starts_on || !cfg.ends_on) return false;
  return todayIso >= cfg.starts_on && todayIso <= cfg.ends_on;
}

export async function fetchSpecialsBody(): Promise<SpecialsBody> {
  const supabase = getSupabase();
  if (!supabase) return { ...DEFAULT_SPECIALS };
  const { data } = await supabase.from("site_pages").select("body").eq("slug", "specials").maybeSingle();
  return mergeSpecialsBody(data?.body);
}
