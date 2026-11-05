import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { CartLine, Fulfillment, Lang, OrderRecord, Product } from "./types";
import { fetchCatalog } from "./catalog";
import { getSupabase } from "./supabase";
import { getSupabaseAdmin } from "./supabase-admin";
import { getOriginPostal, resolveShipRate } from "./shipping";
import { quotePromoCode } from "./promos";
import { sendOrderEmails } from "./mail";
import { isBlockedOrderDate } from "./order-calendar";
import { fetchOrderCalendarServer } from "./order-calendar-server";
import { isAllowedWantedOn, localDateIso, WANTED_ON_RE, wantedNote, wantedOnFromNotes } from "./shop";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEV_ORDER_STATUS_KEY = "dev-order-status";
export const MENU_PRICE_CHANGED_MSG =
  "Menu prices changed. Refresh your cart and try again.";

export class OrderInputError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isValidOrderQty(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 1 && qty <= 99;
}

function productLeadDays(leadDays: unknown): number {
  return typeof leadDays === "number" && Number.isInteger(leadDays) && leadDays >= 0 ? leadDays : 0;
}

export function minWantedOnForLeadDays(maxLead: number, d = new Date()): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  local.setDate(local.getDate() + maxLead);
  return localDateIso(local);
}

export type OrderCatalogProduct = Pick<Product, "id" | "priceCents" | "nameEn" | "nameEs" | "leadDays">;

export function resolveOrderLines(
  items: CartLine[],
  productsById: Map<string, OrderCatalogProduct>,
): { lines: CartLine[]; foodCents: number; maxLead: number } {
  if (!items.length) throw new OrderInputError("Invalid order");
  let foodCents = 0;
  let maxLead = 0;
  const lines: CartLine[] = [];
  for (const item of items) {
    if (!isValidOrderQty(item.qty)) throw new OrderInputError("Invalid quantity");
    const product = productsById.get(item.productId);
    if (!product) throw new OrderInputError("Unknown product");
    if (item.unitPriceCents !== product.priceCents) {
      throw new OrderInputError(MENU_PRICE_CHANGED_MSG);
    }
    maxLead = Math.max(maxLead, productLeadDays(product.leadDays));
    foodCents += product.priceCents * item.qty;
    lines.push({
      ...item,
      unitPriceCents: product.priceCents,
      nameEn: product.nameEn,
      nameEs: product.nameEs,
    });
  }
  return { lines, foodCents, maxLead };
}

function orderStatusHmacKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (key) return key;
  if (process.env.NODE_ENV !== "production") return DEV_ORDER_STATUS_KEY;
  return "";
}

export function orderStatusToken(orderId: string): string {
  const key = orderStatusHmacKey();
  if (!key) throw new OrderInputError("Missing SUPABASE_SERVICE_ROLE_KEY", 503);
  return createHmac("sha256", key).update(orderId).digest("hex");
}

export function orderStatusTokenMatches(orderId: string, token: string): boolean {
  if (!token) return false;
  let expected: string;
  try {
    expected = orderStatusToken(orderId);
  } catch {
    return false;
  }
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

function requireProductionOrderPersistence(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!getSupabase()) {
    throw new OrderInputError(
      "Orders unavailable: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      503,
    );
  }
  if (!getSupabaseAdmin()) {
    throw new OrderInputError("Orders unavailable: set SUPABASE_SERVICE_ROLE_KEY", 503);
  }
}

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
  wantedOn?: string;
  foodCents: number;
  shippingCents: number;
  totalCents: number;
  items: CartLine[];
  serviceCode?: string;
  serviceNameEn?: string;
  serviceNameEs?: string;
  promoCode?: string;
  paymentStatus?: "paid" | "unpaid";
};

export type SubmitOrderResult = {
  id: string;
  source: "supabase" | "local";
  foodCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
  statusToken: string;
  items: CartLine[];
};

export async function submitOrder(
  input: SubmitOrderInput,
  userId?: string | null,
): Promise<SubmitOrderResult> {
  requireProductionOrderPersistence();

  const fulfillment: Fulfillment = input.fulfillment === "delivery" ? "pickup" : input.fulfillment;
  if (!WANTED_ON_RE.test(input.wantedOn ?? "")) {
    throw new OrderInputError("Select a date");
  }
  const wantedOn = input.wantedOn as string;

  const { products } = await fetchCatalog();
  const productsById = new Map(products.map((p) => [p.id, p]));
  const { lines: orderItems, foodCents, maxLead } = resolveOrderLines(input.items, productsById);

  const leadMin = minWantedOnForLeadDays(maxLead);
  if (wantedOn < leadMin) {
    throw new OrderInputError("Order date too soon");
  }

  const { blocked_dates } = await fetchOrderCalendarServer();
  if (!isAllowedWantedOn(wantedOn, new Date(), blocked_dates)) {
    throw new OrderInputError(
      isBlockedOrderDate(wantedOn, blocked_dates) ? "Order date not available" : "Order date too soon",
    );
  }
  const notes = wantedNote(fulfillment === "ship" ? "ship" : "pickup", input.wantedOn as string, input.notes, input.lang);

  let shippingCents = 0;
  let serviceNameEn = input.serviceNameEn;
  let serviceNameEs = input.serviceNameEs;
  if (fulfillment === "ship") {
    const quoted = await resolveShipRate({
      destPostal: input.shipPostal,
      serviceCode: input.serviceCode,
      items: orderItems,
    });
    shippingCents = quoted.rateCents;
    serviceNameEn = quoted.nameEn;
    serviceNameEs = quoted.nameEs;
  }
  let discountCents = 0;
  let promoCode: string | null = null;

  if (input.promoCode?.trim()) {
    const quote = await quotePromoCode(input.promoCode, foodCents);
    if (!quote.ok) {
      throw new OrderInputError(
        quote.error === "min_order" ? "Promo minimum not met" : "Invalid promo code",
      );
    }
    discountCents = quote.discountCents;
    promoCode = quote.code;
  }

  const totalCents = foodCents - discountCents + shippingCents;
  const supabase = getSupabase();
  const id = randomUUID();
  const statusToken = orderStatusToken(id);

  if (supabase) {
    const db = getSupabaseAdmin() ?? supabase;
    const { error: orderError } = await db.from("orders").insert({
      id,
      status: "pending",
      fulfillment,
      lang: input.lang,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      phone: input.phone,
      ship_street: input.shipStreet ?? null,
      ship_city: input.shipCity ?? null,
      ship_province: input.shipProvince ?? null,
      ship_postal: input.shipPostal ?? null,
      notes,
      food_cents: foodCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      discount_cents: discountCents,
      promo_code: promoCode,
      user_id: userId ?? null,
      payment_status: input.paymentStatus ?? "paid",
    });

    if (orderError) {
      throw new Error(orderError.message);
    }

    const orderItemsRows = orderItems.map((item) => ({
      order_id: id,
      product_id: item.productId,
      qty: item.qty,
      unit_price_cents: item.unitPriceCents,
      options_json: item.optionsJson,
      name_en: item.nameEn,
      name_es: item.nameEs,
    }));

    const { error: itemsError } = await db.from("order_items").insert(orderItemsRows);
    if (itemsError) throw new Error(itemsError.message);

    if (fulfillment === "ship" && input.serviceCode) {
      const { error: shipError } = await db.from("shipments").insert({
        order_id: id,
        carrier: "canada_post",
        service_code: input.serviceCode,
        rate_cents: shippingCents,
        tracking_pin: null,
        label_url: null,
        raw_json: {
          serviceNameEn,
          serviceNameEs,
          originPostal: getOriginPostal(),
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
      statusToken,
      items: orderItems,
    };
  }

  // ponytail: file-backed orders when Supabase env is unset; upgrade path = set env vars
  const record: OrderRecord = {
    id,
    status: "pending",
    fulfillment,
    lang: input.lang,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    phone: input.phone,
    shipStreet: input.shipStreet,
    shipCity: input.shipCity,
    shipProvince: input.shipProvince,
    shipPostal: input.shipPostal,
    notes,
    wantedOn: input.wantedOn,
    foodCents,
    shippingCents,
    totalCents,
    discountCents,
    promoCode: promoCode ?? undefined,
    paymentStatus: input.paymentStatus ?? "paid",
    items: orderItems,
    serviceCode: input.serviceCode,
    serviceNameEn,
    serviceNameEs,
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
    statusToken,
    items: orderItems,
  };
}

export async function getOrder(
  id: string,
  client?: SupabaseClient | null,
): Promise<OrderRecord | null> {
  const supabase = client !== undefined ? client : getSupabase();

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
      paymentStatus: order.payment_status === "unpaid" ? "unpaid" : "paid",
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
      wantedOn: wantedOnFromNotes(order.notes),
      foodCents: order.food_cents,
      shippingCents: order.shipping_cents,
      totalCents: order.total_cents,
      discountCents: order.discount_cents ?? 0,
      promoCode: order.promo_code ?? undefined,
      items: (items ?? []).map((item) => ({
        lineId: item.id,
        productId: item.product_id,
        slug: "",
        nameEn: item.name_en ?? "",
        nameEs: item.name_es ?? "",
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

  const local = readLocalOrders().find((o) => o.id === id);
  if (!local) return null;
  return { ...local, wantedOn: local.wantedOn ?? wantedOnFromNotes(local.notes) };
}

export function getLocalOrdersForCheck(): OrderRecord[] {
  return readLocalOrders();
}

export async function attachSquareOrder(orderId: string, squareOrderId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from("orders").update({ square_order_id: squareOrderId }).eq("id", orderId);
}

export async function markOrderPaid(orderId: string, squarePaymentId?: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return { newlyPaid: false };

  if (order.payment_status === "paid") return { newlyPaid: false };

  const { error: updateError } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      square_payment_id: squarePaymentId ?? order.square_payment_id,
    })
    .eq("id", orderId);
  if (updateError) throw new Error(updateError.message);

  const { data: items } = await admin
    .from("order_items")
    .select("qty, unit_price_cents, options_json, product_id, name_en, name_es")
    .eq("order_id", orderId);

  try {
    if (process.env.SQUARE_ENV === "production") {
      await sendOrderEmails({
      id: order.id,
      lang: order.lang,
      fulfillment: order.fulfillment,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      phone: order.phone,
      shipStreet: order.ship_street,
      shipCity: order.ship_city,
      shipProvince: order.ship_province,
      shipPostal: order.ship_postal,
      notes: order.notes,
      wantedOn: wantedOnFromNotes(order.notes),
      foodCents: order.food_cents,
      shippingCents: order.shipping_cents,
      discountCents: order.discount_cents ?? 0,
      totalCents: order.total_cents,
      promoCode: order.promo_code,
      statusToken: orderStatusToken(order.id),
      items: (items ?? []).map((item) => ({
        lineId: item.product_id ?? "",
        productId: item.product_id ?? "",
        slug: "",
        nameEn: item.name_en ?? "",
        nameEs: item.name_es ?? "",
        qty: item.qty,
        unitPriceCents: item.unit_price_cents,
        imageUrl: "",
        optionsJson: (item.options_json ?? {}) as Record<string, string[]>,
      })),
    });
    }
  } catch (err) {
    console.error("order email error", err);
  }

  return { newlyPaid: true };
}
