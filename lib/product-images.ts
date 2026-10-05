const DEFAULT_PRODUCT_IMAGE = "/test-images/swb-banner.png";

export function parseProductImages(imageUrl: string | null | undefined): string[] {
  const raw = imageUrl?.trim() ?? "";
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
      }
    } catch {
      /* plain URL fallback */
    }
  }
  return [raw];
}

export function serializeProductImages(urls: string[]): string {
  const clean = urls.map((u) => u.trim()).filter(Boolean);
  if (clean.length === 0) return DEFAULT_PRODUCT_IMAGE;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

export function primaryProductImage(imageUrl: string | null | undefined): string {
  return parseProductImages(imageUrl)[0] ?? DEFAULT_PRODUCT_IMAGE;
}
