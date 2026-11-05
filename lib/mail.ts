import {
  customerOrderEmail,
  orderEmailHtml,
  ownerOrderEmail,
  type OrderEmailInput,
} from "./order-email";

function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function fromAddress() {
  const raw = process.env.RESEND_FROM?.trim();
  // Resend rejects unverified domains; example.com is a placeholder, not a sender.
  if (raw && !/@example\.com\b/i.test(raw)) return raw;
  return `Sweetbites <${["onboarding", "resend.dev"].join("@")}>`;
}

export async function sendPlainEmail(to: string, subject: string, text: string): Promise<boolean> {
  return sendResend(to, subject, text);
}

export function mailSiteUrl() {
  return siteUrl();
}

async function sendResend(to: string, subject: string, text: string, html?: string) {
  const key = process.env.RESEND_API_KEY;
  const from = fromAddress();
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: html ?? orderEmailHtml(text),
    }),
  });
  if (!res.ok) {
    console.error("order email failed", to, await res.text());
    return false;
  }
  return true;
}

export async function sendOrderEmails(
  order: Omit<OrderEmailInput, "siteUrl">,
): Promise<boolean> {
  const payload: OrderEmailInput = { ...order, siteUrl: siteUrl() };
  const customer = customerOrderEmail(payload);
  const owner = ownerOrderEmail(payload);
  const ownerTo = process.env.ORDER_NOTIFY_EMAIL?.trim();
  const results = await Promise.all([
    sendResend(payload.customerEmail, customer.subject, customer.text, customer.html),
    ownerTo ? sendResend(ownerTo, owner.subject, owner.text) : Promise.resolve(false),
  ]);
  return results[0];
}
