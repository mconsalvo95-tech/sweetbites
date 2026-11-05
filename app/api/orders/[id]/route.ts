import { NextResponse } from "next/server";
import { getOrder, orderStatusTokenMatches } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t");
  let order;
  if (token && orderStatusTokenMatches(id, token)) {
    const admin = getSupabaseAdmin();
    order = await getOrder(id, admin ?? null);
  } else {
    order = await getOrder(id, await getSupabaseServer());
  }
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
