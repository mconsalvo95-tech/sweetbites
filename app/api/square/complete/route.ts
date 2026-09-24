import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { squareEnabled, squareOrderIsPaid } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function site() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://sweetbites.shop";
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id");
  const squareOrderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.redirect(`${site()}/cart?canceled=1`);
  }
  if (!squareEnabled()) {
    return NextResponse.redirect(`${site()}/order-status/${orderId}`);
  }

  try {
    const admin = getSupabaseAdmin();
    const stored = admin
      ? (await admin.from("orders").select("square_order_id").eq("id", orderId).maybeSingle()).data
          ?.square_order_id
      : null;
    const sqId = squareOrderId || stored;
    if (!sqId || !(await squareOrderIsPaid(sqId))) {
      return NextResponse.redirect(`${site()}/order-status/${orderId}`);
    }
    await markOrderPaid(orderId, request.nextUrl.searchParams.get("transactionId") ?? undefined);
  } catch (err) {
    console.error("square complete", err);
    return NextResponse.redirect(`${site()}/order-status/${orderId}`);
  }

  return NextResponse.redirect(`${site()}/order-status/${orderId}?paid=1`);
}
