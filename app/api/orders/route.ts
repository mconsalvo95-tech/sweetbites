import { NextResponse } from "next/server";
import { EMAIL_RE } from "@/lib/format";
import { sendOrderEmails } from "@/lib/mail";
import {
  attachSquareOrder,
  markOrderPaid,
  OrderInputError,
  submitOrder,
  type SubmitOrderInput,
} from "@/lib/orders";
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
      const emailPayload = {
        id: result.id,
        lang: body.lang,
        fulfillment: body.fulfillment === "delivery" ? "pickup" : body.fulfillment,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim().toLowerCase(),
        phone: body.phone.trim(),
        shipStreet: body.shipStreet,
        shipCity: body.shipCity,
        shipProvince: body.shipProvince,
        shipPostal: body.shipPostal,
        notes: body.notes,
        wantedOn: body.wantedOn,
        foodCents: result.foodCents,
        shippingCents: result.shippingCents,
        discountCents: result.discountCents,
        totalCents: result.totalCents,
        promoCode: result.promoCode,
        statusToken: result.statusToken,
        items: result.items,
      };
      // ponytail: sandbox testing panel rarely returns to localhost; production still emails on paid
      if (process.env.SQUARE_ENV !== "production") {
        try {
          await sendOrderEmails(emailPayload);
        } catch (err) {
          console.error("order email error", err);
        }
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
        fulfillment: body.fulfillment === "delivery" ? "pickup" : body.fulfillment,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim().toLowerCase(),
        phone: body.phone.trim(),
        shipStreet: body.shipStreet,
        shipCity: body.shipCity,
        shipProvince: body.shipProvince,
        shipPostal: body.shipPostal,
        notes: body.notes,
        wantedOn: body.wantedOn,
        foodCents: result.foodCents,
        shippingCents: result.shippingCents,
        discountCents: result.discountCents,
        totalCents: result.totalCents,
        promoCode: result.promoCode,
        statusToken: result.statusToken,
        items: result.items,
      });
    } catch (err) {
      console.error("order email error", err);
    }
    return NextResponse.json({ ...result, emailed });
  } catch (err) {
    if (err instanceof OrderInputError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Order failed";
    const status =
      message === "Invalid promo code" ||
      message === "Promo minimum not met" ||
      message === "Select a shipping option" ||
      message === "Select a date" ||
      message === "Order date too soon" ||
      message === "Order date not available"
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
