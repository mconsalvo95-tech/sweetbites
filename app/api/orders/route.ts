import { NextResponse } from "next/server";
import { submitOrder, type SubmitOrderInput } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitOrderInput;
    if (!body.customerName?.trim() || !body.phone?.trim() || !body.items?.length) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }
    const result = await submitOrder(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
