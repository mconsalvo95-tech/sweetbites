import { NextResponse } from "next/server";
import { isValidCanadianPostal } from "@/lib/format";
import { getShippingRates } from "@/lib/shipping";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`ship:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = (await request.json()) as {
      postal?: string;
      items?: { productId: string; qty: number }[];
    };
    if (!body.postal || !isValidCanadianPostal(body.postal) || !body.items?.length) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const quote = await getShippingRates(body.postal, body.items);
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rates failed";
    const status = message === "Shipping quote unavailable" ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
