import { formatCad, pickName } from "./format";
import type { CartLine, Fulfillment, Lang } from "./types";

export type OrderEmailInput = {
  id: string;
  lang: Lang;
  fulfillment: Fulfillment;
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
  discountCents: number;
  totalCents: number;
  promoCode?: string | null;
  items: CartLine[];
  siteUrl: string;
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fulfillmentLabel(f: Fulfillment, lang: Lang) {
  if (f === "pickup") return lang === "es" ? "Recoger" : "Pickup";
  if (f === "delivery") return lang === "es" ? "Entrega" : "Delivery";
  return lang === "es" ? "Envío" : "Ship";
}

function itemLines(items: CartLine[], lang: Lang) {
  return items
    .map((item) => {
      const name = pickName(item, lang);
      const opts = Object.entries(item.optionsJson)
        .map(([k, v]) => `${k}: ${v.join(", ")}`)
        .join("; ");
      const extra = opts ? ` (${opts})` : "";
      return `${item.qty}× ${name}${extra} — ${formatCad(item.unitPriceCents * item.qty)}`;
    })
    .join("\n");
}

function address(order: OrderEmailInput) {
  const parts = [order.shipStreet, order.shipCity, order.shipProvince, order.shipPostal].filter(Boolean);
  return parts.join(", ");
}

export function customerOrderEmail(order: OrderEmailInput): { subject: string; text: string } {
  const es = order.lang === "es";
  const subject = es
    ? `Sweetbites — pedido #${order.id.slice(0, 8)}`
    : `Sweetbites — order #${order.id.slice(0, 8)}`;
  const how = fulfillmentLabel(order.fulfillment, order.lang);
  const disc =
    order.discountCents > 0
      ? `${es ? "Promo" : "Promo"}${order.promoCode ? ` (${order.promoCode})` : ""}: −${formatCad(order.discountCents)}\n`
      : "";
  const ship =
    order.fulfillment === "pickup"
      ? ""
      : `${es ? "Envío/entrega" : "Shipping"}: ${formatCad(order.shippingCents)}\n`;
  const addr = address(order);
  const text = es
    ? `Hola ${order.customerName},\n\nRecibimos tu pedido #${order.id.slice(0, 8)}.\n\n${how}${addr ? `\n${addr}` : ""}\n\n${itemLines(order.items, "es")}\n\nComida: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nVer pedido: ${order.siteUrl}/order-status/${order.id}\n\nSweetbites`
    : `Hi ${order.customerName},\n\nWe got your order #${order.id.slice(0, 8)}.\n\n${how}${addr ? `\n${addr}` : ""}\n\n${itemLines(order.items, "en")}\n\nFood: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nView order: ${order.siteUrl}/order-status/${order.id}\n\nSweetbites`;
  return { subject, text };
}

export function ownerOrderEmail(order: OrderEmailInput): { subject: string; text: string } {
  const subject = `New order #${order.id.slice(0, 8)} — ${formatCad(order.totalCents)}`;
  const addr = address(order);
  const notes = order.notes?.trim() ? `\nNotes: ${order.notes.trim()}\n` : "";
  const disc =
    order.discountCents > 0
      ? `Promo${order.promoCode ? ` (${order.promoCode})` : ""}: −${formatCad(order.discountCents)}\n`
      : "";
  const ship = order.fulfillment === "pickup" ? "" : `Shipping: ${formatCad(order.shippingCents)}\n`;
  const text = `New Sweetbites order\n\n#${order.id}\n${fulfillmentLabel(order.fulfillment, "en")}${addr ? `\n${addr}` : ""}\n\n${order.customerName}\n${order.customerEmail}\n${order.phone}\n${notes}\n${itemLines(order.items, "en")}\n\nFood: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nOpen: ${order.siteUrl}/order-status/${order.id}`;
  return { subject, text };
}

export function orderEmailHtml(text: string) {
  return `<pre style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b1d18;white-space:pre-wrap">${esc(text)}</pre>`;
}
