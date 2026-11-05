import { formatCad, pickName, t } from "./format";
import { shopAddressLine } from "./shop";
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
  wantedOn?: string;
  foodCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  promoCode?: string | null;
  items: CartLine[];
  siteUrl: string;
  statusToken?: string;
};

type OrderStatusLink = Pick<OrderEmailInput, "id" | "siteUrl" | "statusToken">;

function orderStatusUrl(order: OrderStatusLink) {
  const base = `${order.siteUrl}/order-status/${order.id}`;
  return order.statusToken ? `${base}?t=${order.statusToken}` : base;
}

export type OrderStatusNoticeInput = OrderStatusLink & {
  lang: Lang;
  customerName: string;
  shipStreet?: string;
  shipCity?: string;
  shipProvince?: string;
  shipPostal?: string;
};

function shipAddressLine(order: OrderStatusNoticeInput) {
  const parts = [order.shipStreet, order.shipCity, order.shipProvince, order.shipPostal].filter(Boolean);
  return parts.join(", ");
}

export function customerOrderCancelledEmail(order: OrderStatusNoticeInput): { subject: string; text: string } {
  const id8 = order.id.slice(0, 8);
  const link = orderStatusUrl(order);
  if (order.lang === "es") {
    return {
      subject: `Sweetbites — pedido #${id8} cancelado`,
      text: `Hola ${order.customerName}, tu pedido #${id8} ha sido cancelado.\n\nVer pedido: ${link}\n\nSweetbites`,
    };
  }
  return {
    subject: `Sweetbites — order #${id8} cancelled`,
    text: `Hi ${order.customerName}, your order #${id8} has been cancelled.\n\nView order: ${link}\n\nSweetbites`,
  };
}

export function customerOrderShippedEmail(order: OrderStatusNoticeInput): { subject: string; text: string } {
  const id8 = order.id.slice(0, 8);
  const link = orderStatusUrl(order);
  const addr = shipAddressLine(order);
  if (order.lang === "es") {
    return {
      subject: `Sweetbites — pedido #${id8} enviado`,
      text: `Hola ${order.customerName}, tu pedido #${id8} está en camino.${addr ? `\n${addr}` : ""}\n\nVer pedido: ${link}\n\nSweetbites`,
    };
  }
  return {
    subject: `Sweetbites — order #${id8} shipped`,
    text: `Hi ${order.customerName}, your order #${id8} is on its way.${addr ? `\n${addr}` : ""}\n\nView order: ${link}\n\nSweetbites`,
  };
}

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
  if (order.fulfillment === "pickup") return shopAddressLine();
  const parts = [order.shipStreet, order.shipCity, order.shipProvince, order.shipPostal].filter(Boolean);
  return parts.join(", ");
}

function extraNotes(order: OrderEmailInput) {
  return (
    order.notes
      ?.replace(
        /^(?:Pickup date|Ship date|Fecha de recogida|Fecha de envío):\s*\d{4}-\d{2}-\d{2}\s*/i,
        "",
      )
      .trim() ?? ""
  );
}

function etaLine(order: OrderEmailInput) {
  const when = order.wantedOn;
  if (order.fulfillment === "ship") {
    return when
      ? t(`We'll ship on ${when}.`, `Lo enviamos el ${when}.`, order.lang)
      : t("We'll ship this with Canada Post.", "Lo enviamos con Canada Post.", order.lang);
  }
  if (order.fulfillment === "delivery") {
    return when
      ? t(`We'll deliver on ${when}.`, `Lo entregamos el ${when}.`, order.lang)
      : t("We'll deliver in the Red Deer area.", "Lo entregamos en el área de Red Deer.", order.lang);
  }
  return when
    ? t(`Ready for pickup on ${when}.`, `Listo para recoger el ${when}.`, order.lang)
    : t("We'll email when it's ready for pickup.", "Te avisamos cuando esté listo para recoger.", order.lang);
}

function cta(href: string, label: string, bg: string, color: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px">${esc(label)}</a>`;
}

const RECEIPT_CDN = "https://sweetbites.shop";

export function customerReceiptHtml(order: OrderEmailInput) {
  const lang = order.lang;
  const statusUrl = orderStatusUrl(order);
  const contactUrl = `${order.siteUrl}/contact`;
  const wordmark = `${RECEIPT_CDN}/logos/receipt-wordmark.png`;
  const mark = `${RECEIPT_CDN}/logos/receipt-mark.png`;
  const paper = `background-color:#fffaf8;background-image:linear-gradient(rgba(255,250,248,0.88),rgba(255,250,248,0.88)),url('${mark}');background-repeat:no-repeat;background-position:center;background-size:320px`;
  const shortId = order.id.slice(0, 8);
  const addr = address(order);
  const notes = extraNotes(order);
  const items = order.items
    .map((item) => {
      const opts = Object.entries(item.optionsJson)
        .map(([k, v]) => `${k}: ${v.join(", ")}`)
        .join("; ");
      return `<tr>
        <td style="padding:10px 12px;font-size:15px;color:#323335">
          <div style="font-weight:600">${item.qty} ${esc(pickName(item, lang))}</div>
          ${opts ? `<div style="margin-top:2px;font-size:12px">${esc(opts)}</div>` : ""}
        </td>
        <td style="padding:10px 12px;font-size:15px;color:#323335;text-align:right;white-space:nowrap">${formatCad(item.unitPriceCents * item.qty)}</td>
      </tr>`;
    })
    .join("");
  const money = (label: string, value: string, strong = false) =>
    `<tr>
      <td style="padding:6px 12px;font-size:15px;color:#323335${strong ? ";font-weight:700" : ""}">${esc(label)}</td>
      <td style="padding:6px 12px;font-size:15px;color:#323335;text-align:right${strong ? ";font-weight:700" : ""}">${esc(value)}</td>
    </tr>`;
  const promo =
    order.discountCents > 0
      ? money(
          `${t("Promo", "Promo", lang)}${order.promoCode ? `: ${order.promoCode}` : ""}`,
          `−${formatCad(order.discountCents)}`,
        )
      : "";
  const shipping =
    order.fulfillment === "pickup"
      ? ""
      : money(t("Shipping", "Envío", lang), formatCad(order.shippingCents));

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;font-family:Georgia,serif;color:#323335">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:#e7aca7;border-radius:28px 28px 0 0;padding:28px 24px 32px;text-align:center">
          <img src="${esc(wordmark)}" alt="Sweetbites" width="280" style="display:block;margin:0 auto 16px;width:280px;max-width:100%;height:auto;border:0">
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.2">${esc(t("Thanks for your order!", "¡Gracias por tu pedido!", lang))}</h1>
          <p style="margin:0 0 6px;font-size:16px">${esc(order.customerName)} · ${esc(order.phone)}</p>
          <p style="margin:0 0 18px;font-size:16px">${esc(etaLine(order))}${addr ? `<br>${esc(addr)}` : ""}</p>
          ${cta(statusUrl, t("Review order", "Ver pedido", lang), "#aa1d50", "#ffffff")}
        </td></tr>
        <tr><td style="${paper};padding:28px 20px 32px;text-align:center">
          <p style="display:inline-block;margin:0 0 16px;border:2px solid #323335;border-radius:14px;padding:8px 16px;font-size:20px;font-weight:700">${esc(t("Order", "Pedido", lang))} #${esc(shortId)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #323335;border-radius:16px;text-align:left">
            ${items}
            ${money(t("Food", "Comida", lang), formatCad(order.foodCents))}
            ${shipping}
            ${promo}
            ${money(t("Order total", "Total del pedido", lang), formatCad(order.totalCents), true)}
          </table>
          ${notes ? `<p style="margin:16px 0 0;font-size:14px;text-align:left">${esc(t("Notes", "Notas", lang))}: ${esc(notes)}</p>` : ""}
          <h2 style="margin:28px 0 8px;font-size:22px">${esc(t("Need to change order date?", "¿Necesitas cambiar la fecha del pedido?", lang))}</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.4">${esc(t("Cancellations are not available. Contact us as soon as possible to reschedule your pickup or delivery (subject to availability).", "No se puede cancelar. Contáctanos lo antes posible para reprogramar la recogida o la entrega (según disponibilidad).", lang))}</p>
          ${cta(contactUrl, t("Need to change order date?", "¿Necesitas cambiar la fecha del pedido?", lang), "#aa1d50", "#ffffff")}
        </td></tr>
        <tr><td style="background:#e7aca7;border-radius:0 0 28px 28px;padding:28px 24px 32px;text-align:center">
          <h2 style="margin:0 0 8px;font-size:22px">${esc(t("Contact us", "Contáctanos", lang))}</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.4">${esc(t("Questions about this order? We're here.", "¿Preguntas sobre este pedido? Estamos aquí.", lang))}</p>
          ${cta(contactUrl, t("Contact us", "Contáctanos", lang), "#ffffff", "#323335")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function customerOrderEmail(order: OrderEmailInput): { subject: string; text: string; html: string } {
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
  const when = order.wantedOn
    ? es
      ? order.fulfillment === "ship"
        ? `\nFecha de envío: ${order.wantedOn}`
        : `\nFecha de recogida: ${order.wantedOn}`
      : order.fulfillment === "ship"
        ? `\nShip date: ${order.wantedOn}`
        : `\nPickup date: ${order.wantedOn}`
    : "";
  const text = es
    ? `Hola ${order.customerName},\n\nRecibimos tu pedido #${order.id.slice(0, 8)}.\n\n${how}${when}${addr ? `\n${addr}` : ""}\n\n${itemLines(order.items, "es")}\n\nComida: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nVer pedido: ${orderStatusUrl(order)}\n\nSweetbites`
    : `Hi ${order.customerName},\n\nWe got your order #${order.id.slice(0, 8)}.\n\n${how}${when}${addr ? `\n${addr}` : ""}\n\n${itemLines(order.items, "en")}\n\nFood: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nView order: ${orderStatusUrl(order)}\n\nSweetbites`;
  return { subject, text, html: customerReceiptHtml(order) };
}

export function ownerOrderEmail(order: OrderEmailInput): { subject: string; text: string } {
  const subject = `New order #${order.id.slice(0, 8)} — ${formatCad(order.totalCents)}`;
  const addr = address(order);
  const when = order.wantedOn
    ? order.fulfillment === "ship"
      ? `\nShip date: ${order.wantedOn}`
      : `\nPickup date: ${order.wantedOn}`
    : "";
  const notesRaw = order.notes?.replace(
    /^(?:Pickup date|Ship date|Fecha de recogida|Fecha de envío):\s*\d{4}-\d{2}-\d{2}\s*/i,
    "",
  ).trim();
  const notes = notesRaw ? `\nNotes: ${notesRaw}\n` : "";
  const disc =
    order.discountCents > 0
      ? `Promo${order.promoCode ? ` (${order.promoCode})` : ""}: −${formatCad(order.discountCents)}\n`
      : "";
  const ship = order.fulfillment === "pickup" ? "" : `Shipping: ${formatCad(order.shippingCents)}\n`;
  const text = `New Sweetbites order\n\n#${order.id}\n${fulfillmentLabel(order.fulfillment, "en")}${when}${addr ? `\n${addr}` : ""}\n\n${order.customerName}\n${order.customerEmail}\n${order.phone}\n${notes}\n${itemLines(order.items, "en")}\n\nFood: ${formatCad(order.foodCents)}\n${disc}${ship}Total: ${formatCad(order.totalCents)}\n\nOpen: ${orderStatusUrl(order)}`;
  return { subject, text };
}

export function orderEmailHtml(text: string) {
  return `<pre style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b1d18;white-space:pre-wrap">${esc(text)}</pre>`;
}
