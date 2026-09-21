import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrder(id, await getSupabaseServer());
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
