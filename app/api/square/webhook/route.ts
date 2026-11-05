import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { squareOrderIsPaid, verifySquareSignature } from "@/lib/square";

export async function POST(request: NextRequest) {
  const secret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  const raw = await request.text();
  if (!secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const header = request.headers.get("x-square-hmacsha256-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")}/api/square/webhook`;
  if (!verifySquareSignature(url, raw, header, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    type?: string;
    data?: { object?: { payment?: { note?: string; order_id?: string; id?: string; status?: string } } };
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = body.data?.object?.payment;
  if (body.type !== "payment.updated" || payment?.status !== "COMPLETED") {
    return NextResponse.json({ ok: true });
  }

  try {
    if (payment.order_id) {
      const paid = await squareOrderIsPaid(payment.order_id);
      if (!paid) return NextResponse.json({ ok: true });
    }
    const orderId = payment.note?.trim();
    if (orderId) await markOrderPaid(orderId, payment.id);
  } catch (err) {
    console.error("square webhook", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
