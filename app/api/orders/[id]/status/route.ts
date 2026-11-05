import { NextResponse } from "next/server";
import {
  customerOrderCancelledEmail,
  customerOrderShippedEmail,
  type OrderStatusNoticeInput,
} from "@/lib/order-email";
import { mailSiteUrl, sendPlainEmail } from "@/lib/mail";
import { orderStatusToken } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUserId, getSupabaseServer } from "@/lib/supabase-server";
import type { Lang } from "@/lib/types";

const ADMIN_STATUSES = new Set(["pending", "completed", "sent", "done", "cancelled"]);

type OrderStatusRow = {
  status: string;
  payment_status: string | null;
  user_id: string | null;
  customer_email: string | null;
  customer_name: string;
  lang: Lang;
  ship_street: string | null;
  ship_city: string | null;
  ship_province: string | null;
  ship_postal: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const next = typeof body.status === "string" ? body.status.trim() : "";
  if (!next || !ADMIN_STATUSES.has(next)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const { data: row, error: fetchErr } = await admin
    .from("orders")
    .select(
      "status, payment_status, user_id, customer_email, customer_name, lang, ship_street, ship_city, ship_province, ship_postal",
    )
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const order = row as OrderStatusRow;
  const current = order.status;

  if (current === next) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  const supabase = await getSupabaseServer();
  const { data: profile } = supabase
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  if (
    !isAdmin &&
    next === "cancelled" &&
    order.user_id === userId &&
    order.payment_status === "paid"
  ) {
    return NextResponse.json(
      { error: "Paid orders must be cancelled by the shop" },
      { status: 403 },
    );
  }

  let allowed = false;
  if (isAdmin) allowed = true;
  else if (next === "cancelled" && order.user_id === userId && current === "pending") allowed = true;

  if (!allowed) {
    const msg =
      next === "cancelled" && order.user_id === userId
        ? "Cannot cancel this order"
        : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { error: updErr } = await admin.from("orders").update({ status: next }).eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  const shouldEmail =
    (next === "cancelled" && current !== "cancelled") ||
    (next === "sent" && current === "pending");

  let emailed = false;
  const emailTo = order.customer_email?.trim();
  if (shouldEmail && emailTo) {
    try {
      const notice: OrderStatusNoticeInput = {
        id,
        lang: order.lang === "es" ? "es" : "en",
        customerName: order.customer_name,
        siteUrl: mailSiteUrl(),
        statusToken: orderStatusToken(id),
        shipStreet: order.ship_street ?? undefined,
        shipCity: order.ship_city ?? undefined,
        shipProvince: order.ship_province ?? undefined,
        shipPostal: order.ship_postal ?? undefined,
      };
      const { subject, text } =
        next === "cancelled"
          ? customerOrderCancelledEmail(notice)
          : customerOrderShippedEmail(notice);
      emailed = await sendPlainEmail(emailTo, subject, text);
    } catch (err) {
      console.error("order status email error", err);
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
