import { NextResponse } from "next/server";
import { quotePromoCode } from "@/lib/promos";

export async function POST(request: Request) {
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
    const message = err instanceof Error ? err.message : "Promo failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
