type Token = { access_token: string; expires_in?: number };

const TOKEN_URL =
  "https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token";
const RATES_URL =
  "https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/prices";

// ponytail: one in-memory token per server instance; upgrade = shared cache if we scale out
let cached: { token: string; exp: number } | null = null;

export function cpcEnabled() {
  return Boolean(
    process.env.CPC_API_KEY?.trim() &&
      process.env.CPC_API_SECRET?.trim() &&
      process.env.CPC_CUSTOMER_NUMBER?.trim(),
  );
}

function clientId() {
  return process.env.CPC_API_KEY!.trim();
}

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.exp) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "X-IBM-Client-Id": clientId(),
      "X-IBM-Client-Secret": process.env.CPC_API_SECRET!.trim(),
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "scope=merchant&grant_type=client_credentials",
  });
  const data = (await res.json().catch(() => ({}))) as Token & {
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `CPC token ${res.status}`);
  }
  cached = {
    token: data.access_token,
    exp: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return cached.token;
}

export type CpcQuote = {
  serviceCode?: string;
  serviceName?: string;
  priceDetails?: { due?: number };
  serviceStandard?: { expectedTransitTime?: number; expectedDeliveryDate?: string };
};

export async function cpcGetRates(input: {
  originPostal: string;
  destPostal: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}): Promise<CpcQuote[]> {
  const token = await accessToken();
  const res = await fetch(RATES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-IBM-Client-Id": clientId(),
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerNumber: process.env.CPC_CUSTOMER_NUMBER!.trim(),
      quoteType: "commercial",
      parcelCharacteristics: {
        weight: input.weightKg,
        dimensions: {
          length: input.lengthCm,
          width: input.widthCm,
          height: input.heightCm,
        },
      },
      originPostalCode: input.originPostal,
      destination: { domestic: { postalCode: input.destPostal } },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as
    | CpcQuote[]
    | { priceQuotes?: CpcQuote[]; message?: string; error_description?: string };
  if (!res.ok) {
    const msg =
      (!Array.isArray(data) &&
        (data.message || data.error_description)) ||
      `CPC rates ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : data.priceQuotes ?? [];
}
