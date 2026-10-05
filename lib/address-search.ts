export type AddressHit = {
  label: string;
  street: string;
  city: string;
  province: string;
  postal: string;
};

const PROVINCE_CODE: Record<string, string> = {
  alberta: "AB",
  "british columbia": "BC",
  manitoba: "MB",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  newfoundland: "NL",
  "nova scotia": "NS",
  "northwest territories": "NT",
  nunavut: "NU",
  ontario: "ON",
  "prince edward island": "PE",
  quebec: "QC",
  québec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

export function provinceCode(state: string | undefined): string {
  const key = (state ?? "").trim().toLowerCase();
  if (PROVINCE_CODE[key]) return PROVINCE_CODE[key];
  const upper = (state ?? "").trim().toUpperCase();
  return Object.values(PROVINCE_CODE).includes(upper) ? upper : "";
}

type PhotonProps = {
  housenumber?: string;
  street?: string;
  name?: string;
  city?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
  type?: string;
};

const SKIP_TYPES = new Set(["city", "state", "country", "county", "district", "locality"]);

export function addressFromPhoton(properties: PhotonProps): AddressHit | null {
  if ((properties.countrycode ?? "CA").toUpperCase() !== "CA") return null;
  if (properties.type && SKIP_TYPES.has(properties.type)) return null;
  const street = [properties.housenumber, properties.street].filter(Boolean).join(" ").trim()
    || properties.name?.trim()
    || "";
  const city = properties.city?.trim() ?? "";
  const province = provinceCode(properties.state);
  const postal = (properties.postcode ?? "").toUpperCase();
  if (!street && !city) return null;
  const label = [street, city, province, postal].filter(Boolean).join(", ");
  return { label, street, city, province, postal };
}

export async function searchCanadianAddresses(query: string): Promise<AddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&countrycode=ca`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: { properties?: PhotonProps }[] };
  const hits: AddressHit[] = [];
  for (const feature of data.features ?? []) {
    const hit = feature.properties ? addressFromPhoton(feature.properties) : null;
    if (hit && !hits.some((item) => item.label === hit.label)) hits.push(hit);
  }
  return hits;
}
