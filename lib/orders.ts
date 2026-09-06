import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { CartLine, Fulfillment, Lang, OrderRecord } from "./types";
import { getSupabase } from "./supabase";

const LOCAL_FILE = join(process.cwd(), ".local-orders.json");

function readLocalOrders(): OrderRecord[] {
  if (!existsSync(LOCAL_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, "utf8")) as OrderRecord[];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: OrderRecord[]): void {
  writeFileSync(LOCAL_FILE, JSON.stringify(orders, null, 2));
}

export type SubmitOrderInput = {
  fulfillment: Fulfillment;
  lang: Lang;
  customerName: string;
  phone: string;
  shipStreet?: string;
  shipCity?: string;
  shipProvince?: string;
  shipPostal?: string;
  notes?: string;
  foodCents: number;
  shippingCents: number;
  totalCents: number;
  items: CartLine[];
  serviceCode?: string;
  serviceNameEn?: string;
  serviceNameEs?: string;
};

export type SubmitOrderResult = {
  id: string;
  source: "supabase" | "local";
};

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const supabase = getSupabase();

  if (supabase) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        fulfillment: input.fulfillment,
        lang: input.lang,
        customer_name: input.customerName,
        phone: input.phone,
        ship_street: input.shipStreet ?? null,
        ship_city: input.shipCity ?? null,
        ship_province: input.shipProvince ?? null,
        ship_postal: input.shipPostal ?? null,
        notes: input.notes ?? null,
        food_cents: input.foodCents,
        shipping_cents: input.shippingCents,
        total_cents: input.totalCents,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Failed to create order");
    }

    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      qty: item.qty,
      unit_price_cents: item.unitPriceCents,
      options_json: item.optionsJson,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw new Error(itemsError.message);

    if (input.fulfillment === "ship" && input.serviceCode) {
      const { error: shipError } = await supabase.from("shipments").insert({
        order_id: order.id,
        carrier: "canada_post",
        service_code: input.serviceCode,
        rate_cents: input.shippingCents,
        tracking_pin: null,
        label_url: null,
        raw_json: {
          mock: true,
          serviceNameEn: input.serviceNameEn,
          serviceNameEs: input.serviceNameEs,
          originPostal: "M5V 2T6",
        },
      });
      if (shipError) throw new Error(shipError.message);
    }

    return { id: order.id, source: "supabase" };
  }

  // ponytail: file-backed orders when Supabase env is unset; upgrade path = set env vars
  const id = randomUUID();
  const record: OrderRecord = {
    id,
    status: "pending",
    fulfillment: input.fulfillment,
    lang: input.lang,
    customerName: input.customerName,
    phone: input.phone,
    shipStreet: input.shipStreet,
    shipCity: input.shipCity,
    shipProvince: input.shipProvince,
    shipPostal: input.shipPostal,
    notes: input.notes,
    foodCents: input.foodCents,
    shippingCents: input.shippingCents,
    totalCents: input.totalCents,
    items: input.items,
    serviceCode: input.serviceCode,
    serviceNameEn: input.serviceNameEn,
    serviceNameEs: input.serviceNameEs,
  };

  const orders = readLocalOrders();
  orders.push(record);
  writeLocalOrders(orders);

  return { id, source: "local" };
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const supabase = getSupabase();

  if (supabase) {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !order) return readLocalOrders().find((o) => o.id === id) ?? null;

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    const { data: shipment } = await supabase
      .from("shipments")
      .select("service_code, rate_cents, raw_json")
      .eq("order_id", id)
      .maybeSingle();

    const rawJson = shipment?.raw_json as { serviceNameEn?: string; serviceNameEs?: string } | null;

    return {
      id: order.id,
      status: order.status,
      fulfillment: order.fulfillment,
      lang: order.lang,
      customerName: order.customer_name,
      phone: order.phone,
      shipStreet: order.ship_street ?? undefined,
      shipCity: order.ship_city ?? undefined,
      shipProvince: order.ship_province ?? undefined,
      shipPostal: order.ship_postal ?? undefined,
      notes: order.notes ?? undefined,
      foodCents: order.food_cents,
      shippingCents: order.shipping_cents,
      totalCents: order.total_cents,
      items: (items ?? []).map((item) => ({
        lineId: item.id,
        productId: item.product_id,
        slug: "",
        nameEn: "",
        nameEs: "",
        qty: item.qty,
        unitPriceCents: item.unit_price_cents,
        imageUrl: "",
        optionsJson: item.options_json as Record<string, string[]>,
      })),
      serviceCode: shipment?.service_code,
      serviceNameEn: rawJson?.serviceNameEn,
      serviceNameEs: rawJson?.serviceNameEs,
    };
  }

  return readLocalOrders().find((o) => o.id === id) ?? null;
}

export function getLocalOrdersForCheck(): OrderRecord[] {
  return readLocalOrders();
}
