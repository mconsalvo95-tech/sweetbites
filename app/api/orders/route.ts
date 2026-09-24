import { NextResponse } from "next/server";
import { EMAIL_RE } from "@/lib/format";
import { sendOrderEmails } from "@/lib/mail";
import { attachSquareOrder, markOrderPaid, submitOrder, type SubmitOrderInput } from "@/lib/orders";
import { createSquareCheckout, squareEnabled } from "@/lib/square";
import { getAuthUserId } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitOrderInput;
    if (
      !body.customerName?.trim() ||
      !body.phone?.trim() ||
      !body.customerEmail?.trim() ||
      !EMAIL_RE.test(body.customerEmail.trim()) ||
      !body.items?.length
    ) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }
    const userId = await getAuthUserId();
    const takeCard = squareEnabled();
    const result = await submitOrder(
      {
        ...body,
        customerEmail: body.customerEmail.trim().toLowerCase(),
        paymentStatus: takeCard ? "unpaid" : "paid",
      },
      userId,
    );

    if (takeCard && result.totalCents > 0) {
      const checkout = await createSquareCheckout({
        orderId: result.id,
        totalCents: result.totalCents,
        email: body.customerEmail.trim().toLowerCase(),
      });
      if (!checkout.url) {
        return NextResponse.json({ error: "Square checkout unavailable" }, { status: 500 });
      }
      if (checkout.squareOrderId) {
        await attachSquareOrder(result.id, checkout.squareOrderId);
      }
      return NextResponse.json({ ...result, checkoutUrl: checkout.url });
    }

    if (takeCard && result.totalCents === 0) {
      await markOrderPaid(result.id);
      return NextResponse.json({ ...result, emailed: true });
    }

    let emailed = false;
    try {
      emailed = await sendOrderEmails({
        id: result.id,
        lang: body.lang,
        fulfillment: body.fulfillment,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim().toLowerCase(),
        phone: body.phone.trim(),
        shipStreet: body.shipStreet,
        shipCity: body.shipCity,
        shipProvince: body.shipProvince,
        shipPostal: body.shipPostal,
        notes: body.notes,
        foodCents: result.foodCents,
        shippingCents: result.shippingCents,
        discountCents: result.discountCents,
        totalCents: result.totalCents,
        promoCode: result.promoCode,
        items: body.items,
      });
    } catch (err) {
      console.error("order email error", err);
    }
    return NextResponse.json({ ...result, emailed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed";
    const status =
      message === "Invalid promo code" ||
      message === "Promo minimum not met" ||
      message === "Select a shipping option"
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
