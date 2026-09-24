import { NextResponse } from "next/server";
import { isValidCanadianPostal } from "@/lib/format";
import { getShippingRates } from "@/lib/shipping";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
