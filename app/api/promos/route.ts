import { NextResponse } from "next/server";
import { quotePromoCode } from "@/lib/promos";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`promo:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = (await request.json()) as { code?: string; foodCents?: number };
    const foodCents = Number(body.foodCents);
    if (!body.code?.trim() || !Number.isFinite(foodCents) || foodCents < 0) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const quote = await quotePromoCode(body.code, foodCents);
    if (!quote.ok) {
      return NextResponse.json(quote, { status: 400 });
    }
    return NextResponse.json(quote);
  } catch (err) {
    console.error("promo check failed", err);
    return NextResponse.json({ error: "Promo check failed" }, { status: 500 });
  }
}
