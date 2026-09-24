import { createHmac, timingSafeEqual } from "crypto";

const SQUARE_VERSION = "2025-01-23";

export function squareEnabled() {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN?.trim() && process.env.SQUARE_LOCATION_ID?.trim(),
  );
}

function squareHost() {
  return process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function squareFetch(path: string, init?: RequestInit) {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Square is not configured");
  const res = await fetch(`${squareHost()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await res.json()) as {
    errors?: { detail?: string }[];
    [key: string]: unknown;
  };
  if (!res.ok) {
    throw new Error(data.errors?.[0]?.detail ?? `Square ${res.status}`);
  }
  return data;
}

export async function createSquareCheckout(input: {
  orderId: string;
  totalCents: number;
  email: string;
}) {
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  if (!locationId) throw new Error("Square is not configured");
  const data = await squareFetch("/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: input.orderId,
      quick_pay: {
        name: "Sweetbites order",
        price_money: { amount: input.totalCents, currency: "CAD" },
        location_id: locationId,
      },
      checkout_options: {
        redirect_url: `${siteUrl()}/api/square/complete?order_id=${input.orderId}`,
        ask_for_shipping_address: false,
      },
      pre_populated_data: { buyer_email: input.email },
      payment_note: input.orderId,
    }),
  });
  const link = data.payment_link as { id?: string; url?: string; order_id?: string } | undefined;
  if (!link?.url) throw new Error("Square did not return a checkout URL");
  return { url: link.url, squareOrderId: link.order_id ?? null };
}

export async function squareOrderIsPaid(squareOrderId: string) {
  const data = await squareFetch(`/v2/orders/${encodeURIComponent(squareOrderId)}`);
  const order = data.order as {
    state?: string;
    tenders?: unknown[];
    net_amount_due_money?: { amount?: number };
    reference_id?: string;
    ticket_name?: string;
  };
  if (!order) return false;
  if (order.state === "COMPLETED") return true;
  if ((order.tenders?.length ?? 0) > 0) return true;
  return (order.net_amount_due_money?.amount ?? 1) === 0;
}

export function expectedSquareSignature(notificationUrl: string, body: string, signatureKey: string) {
  return createHmac("sha256", signatureKey).update(notificationUrl + body).digest("base64");
}

export function verifySquareSignature(notificationUrl: string, body: string, header: string, signatureKey: string) {
  const expected = expectedSquareSignature(notificationUrl, body, signatureKey);
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
