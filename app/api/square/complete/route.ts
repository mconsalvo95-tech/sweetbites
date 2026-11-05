import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid, orderStatusToken } from "@/lib/orders";
import { squareEnabled, squareOrderIsPaid } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function site() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://sweetbites.shop";
}

function statusRedirect(orderId: string, query: Record<string, string>) {
  const q = new URLSearchParams(query);
  try {
    q.set("t", orderStatusToken(orderId));
  } catch {
    /* dev without service role */
  }
  return `${site()}/order-status/${orderId}?${q.toString()}`;
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id");
  const squareOrderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.redirect(`${site()}/cart?canceled=1`);
  }
  if (!squareEnabled()) {
    return NextResponse.redirect(statusRedirect(orderId, {}));
  }

  try {
    const admin = getSupabaseAdmin();
    const stored = admin
      ? (await admin.from("orders").select("square_order_id").eq("id", orderId).maybeSingle()).data
          ?.square_order_id
      : null;
    const sqId = squareOrderId || stored;
    if (!sqId || !(await squareOrderIsPaid(sqId))) {
      return NextResponse.redirect(statusRedirect(orderId, {}));
    }
    await markOrderPaid(orderId, request.nextUrl.searchParams.get("transactionId") ?? undefined);
  } catch (err) {
    console.error("square complete", err);
    return NextResponse.redirect(statusRedirect(orderId, {}));
  }

  return NextResponse.redirect(statusRedirect(orderId, { paid: "1" }));
}
