import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { CartLine, Fulfillment, Lang, OrderRecord } from "./types";
import { getSupabase } from "./supabase";
import { quotePromoCode } from "./promos";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  customerEmail: string;
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
  promoCode?: string;
};

export type SubmitOrderResult = {
  id: string;
  source: "supabase" | "local";
  foodCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
};

export async function submitOrder(
  input: SubmitOrderInput,
  userId?: string | null,
): Promise<SubmitOrderResult> {
  const foodCents = input.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.qty,
    0,
  );
  const shippingCents = Math.max(0, input.shippingCents);
  let discountCents = 0;
  let promoCode: string | null = null;

  if (input.promoCode?.trim()) {
    const quote = await quotePromoCode(input.promoCode, foodCents);
    if (!quote.ok) {
      throw new Error(
        quote.error === "min_order" ? "Promo minimum not met" : "Invalid promo code",
      );
    }
    discountCents = quote.discountCents;
    promoCode = quote.code;
  }

  const totalCents = foodCents - discountCents + shippingCents;
  const supabase = getSupabase();
  const id = randomUUID();

  if (supabase) {
    // ponytail: insert without RETURNING — SELECT RLS hides the new row from the anon client
    const { error: orderError } = await supabase.from("orders").insert({
      id,
      status: "pending",
      fulfillment: input.fulfillment,
      lang: input.lang,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      phone: input.phone,
      ship_street: input.shipStreet ?? null,
      ship_city: input.shipCity ?? null,
      ship_province: input.shipProvince ?? null,
      ship_postal: input.shipPostal ?? null,
      notes: input.notes ?? null,
      food_cents: foodCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      discount_cents: discountCents,
      promo_code: promoCode,
      user_id: userId ?? null,
    });

    if (orderError) {
      throw new Error(orderError.message);
    }

    const orderItems = input.items.map((item) => ({
      order_id: id,
      product_id: item.productId,
      qty: item.qty,
      unit_price_cents: item.unitPriceCents,
      options_json: item.optionsJson,
      name_en: item.nameEn,
      name_es: item.nameEs,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw new Error(itemsError.message);

    if (input.fulfillment === "ship" && input.serviceCode) {
      const { error: shipError } = await supabase.from("shipments").insert({
        order_id: id,
        carrier: "canada_post",
        service_code: input.serviceCode,
        rate_cents: shippingCents,
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

    return {
      id,
      source: "supabase",
      foodCents,
      shippingCents,
      discountCents,
      totalCents,
      promoCode,
    };
  }

  // ponytail: file-backed orders when Supabase env is unset; upgrade path = set env vars
  const record: OrderRecord = {
    id,
    status: "pending",
    fulfillment: input.fulfillment,
    lang: input.lang,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    phone: input.phone,
    shipStreet: input.shipStreet,
    shipCity: input.shipCity,
    shipProvince: input.shipProvince,
    shipPostal: input.shipPostal,
    notes: input.notes,
    foodCents,
    shippingCents,
    totalCents,
    discountCents,
    promoCode: promoCode ?? undefined,
    items: input.items,
    serviceCode: input.serviceCode,
    serviceNameEn: input.serviceNameEn,
    serviceNameEs: input.serviceNameEs,
  };

  const orders = readLocalOrders();
  orders.push(record);
  writeLocalOrders(orders);

  return {
    id,
    source: "local",
    foodCents,
    shippingCents,
    discountCents,
    totalCents,
    promoCode,
  };
}

export async function getOrder(
  id: string,
  client?: SupabaseClient | null,
): Promise<OrderRecord | null> {
  const supabase = client ?? getSupabase();

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
      customerEmail: order.customer_email ?? "",
      phone: order.phone,
      shipStreet: order.ship_street ?? undefined,
      shipCity: order.ship_city ?? undefined,
      shipProvince: order.ship_province ?? undefined,
      shipPostal: order.ship_postal ?? undefined,
      notes: order.notes ?? undefined,
      foodCents: order.food_cents,
      shippingCents: order.shipping_cents,
      totalCents: order.total_cents,
      discountCents: order.discount_cents ?? 0,
      promoCode: order.promo_code ?? undefined,
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
