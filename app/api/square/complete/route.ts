import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid, orderStatusToken } from "@/lib/orders";
import { squareEnabled } from "@/lib/square";

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
  if (!orderId) {
    return NextResponse.redirect(`${site()}/cart?canceled=1`);
  }
  if (!squareEnabled()) {
    return NextResponse.redirect(statusRedirect(orderId, {}));
  }

  let isPaid = false;
  try {
    const result = await markOrderPaid(
      orderId,
      request.nextUrl.searchParams.get("transactionId") ?? undefined,
    );
    isPaid = result.isPaid;
  } catch (err) {
    console.error("square complete", err);
    return NextResponse.redirect(statusRedirect(orderId, {}));
  }

  return NextResponse.redirect(
    statusRedirect(orderId, isPaid ? { paid: "1" } : {}),
  );
}
