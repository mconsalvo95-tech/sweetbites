"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { formatCad, pickName, t } from "@/lib/format";
import { canCustomerCancel, type CartLine, type Fulfillment, type Lang } from "@/lib/types";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { LocationContent } from "@/app/location/LocationContent";

type OrderView = {
  id: string;
  status?: string;
  paymentStatus?: "paid" | "unpaid";
  fulfillment: Fulfillment;
  lang: Lang;
  customerName: string;
  foodCents: number;
  shippingCents: number;
  totalCents: number;
  discountCents?: number;
  promoCode?: string;
  items: CartLine[];
  notes?: string;
  wantedOn?: string;
  serviceCode?: string;
  serviceNameEn?: string;
  serviceNameEs?: string;
};

export default function OrderStatusPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const statusToken = searchParams.get("t");
  const { lang } = useLang();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const qs = statusToken ? `?t=${encodeURIComponent(statusToken)}` : "";
        const res = await fetch(`/api/orders/${id}${qs}`);
        if (res.ok) {
          const data = await res.json();
          setOrder({ id, ...data });
          return;
        }
      } catch {
        /* fall through */
      }

      const cached = localStorage.getItem(`sweetbites-order-${id}`);
      if (cached) {
        setOrder({ id, ...(JSON.parse(cached) as Omit<OrderView, "id">) });
      }
      setLoading(false);
    }
    load().finally(() => setLoading(false));
  }, [id, statusToken]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("paid") !== "1") return;
    clearCart();
    if (!id) return;
    const key = `sweetbites-order-${id}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as OrderView;
      localStorage.setItem(key, JSON.stringify({ ...parsed, paymentStatus: "paid" }));
      setOrder((prev) => (prev ? { ...prev, paymentStatus: "paid" } : prev));
    }
  }, [clearCart, id]);

  const cancelOrder = async () => {
    if (!id || !user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const ok = window.confirm(
      t("Cancel this order? The shop will stop preparing it.", "¿Cancelar este pedido? La tienda dejará de prepararlo.", lang),
    );
    if (!ok) return;
    setCancelBusy(true);
    setCancelMsg("");
    const { error } = await supabase.rpc("cancel_own_order", { order_id: id });
    setCancelBusy(false);
    if (error) {
      setCancelMsg(error.message);
      return;
    }
    setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
  };

  if (loading) {
    return <p className="text-center text-coal/70">{t("Loading…", "Cargando…", lang)}</p>;
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p>{t("Order not found", "Pedido no encontrado", lang)}</p>
        <Link href="/" className="mt-4 inline-block text-berry underline">
          {t("Back home", "Volver al inicio", lang)}
        </Link>
      </div>
    );
  }

  const serviceName =
    lang === "es" ? order.serviceNameEs : order.serviceNameEn;
  const status = order.status || "pending";
  const cancelled = status === "cancelled";
  const unpaid = order.paymentStatus === "unpaid" && !cancelled;

  return (
    <div className="relative z-10 space-y-6 text-center">
      <div
        className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
          cancelled || unpaid ? "bg-coal/10 text-coal/70" : "bg-berry/10 text-berry"
        }`}
      >
        {cancelled
          ? t("Order cancelled", "Pedido cancelado", lang)
          : unpaid
            ? t("Awaiting payment", "Esperando el pago", lang)
          : `✓ ${t("Order received", "Pedido recibido", lang)}`}
      </div>

      <h1 className="font-display text-2xl font-semibold">
        {cancelled
          ? t("This order was cancelled", "Este pedido fue cancelado", lang)
          : unpaid
            ? t("Finish paying on Square", "Termina de pagar en Square", lang)
          : t("We got your order", "Recibimos tu pedido", lang)}{" "}
        #{order.id.slice(0, 8)}
      </h1>

      <p className="text-coal/75">
        {unpaid
          ? t(
              "Your order is saved. Complete payment on the Square page to confirm it.",
              "Tu pedido está guardado. Completa el pago en Square para confirmarlo.",
              lang,
            )
          : t(
          `Thanks ${order.customerName}! We emailed a confirmation to you.`,
          `¡Gracias ${order.customerName}! Te enviamos la confirmación por correo.`,
          lang,
        )}
      </p>

      <div className="space-y-3 rounded-[18px] bg-white p-5 text-left shadow-sm">
        <h2 className="font-medium">{t("Summary", "Resumen", lang)}</h2>
        {order.items.map((item) => (
          <div key={item.lineId} className="flex justify-between text-sm">
            <span>
              {item.qty}× {pickName(item, lang)}
            </span>
            <span>{formatCad(item.unitPriceCents * item.qty)}</span>
          </div>
        ))}
        <div className="space-y-1 border-t border-blush/40 pt-3 text-sm">
          <div className="flex justify-between">
            <span>{t("Food", "Comida", lang)}</span>
            <span>{formatCad(order.foodCents)}</span>
          </div>
          {(order.discountCents ?? 0) > 0 && (
            <div className="flex justify-between text-berry">
              <span>
                {t("Promo", "Promo", lang)}
                {order.promoCode ? ` (${order.promoCode})` : ""}
              </span>
              <span>−{formatCad(order.discountCents ?? 0)}</span>
            </div>
          )}
          {order.fulfillment === "ship" && (
            <>
              <div className="flex justify-between">
                <span>{t("Shipping", "Envío", lang)}</span>
                <span>{formatCad(order.shippingCents)}</span>
              </div>
              {serviceName && (
                <p className="text-xs text-coal/60">
                  {t(
                    `Quoted as ${serviceName} — ${formatCad(order.shippingCents)}.`,
                    `Cotizado como ${serviceName} — ${formatCad(order.shippingCents)}.`,
                    lang,
                  )}
                </p>
              )}
            </>
          )}
          {order.fulfillment === "delivery" && (
            <div className="flex justify-between">
              <span>{t("Local delivery", "Entrega local", lang)}</span>
              <span>{formatCad(order.shippingCents)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>{t("Total", "Total", lang)}</span>
            <span className="text-berry">{formatCad(order.totalCents)}</span>
          </div>
        </div>
        {order.wantedOn && (
          <p className="pt-2 text-sm text-coal/70">
            {order.fulfillment === "ship"
              ? t(`Ship date: ${order.wantedOn}`, `Fecha de envío: ${order.wantedOn}`, lang)
              : t(`Pickup date: ${order.wantedOn}`, `Fecha de recogida: ${order.wantedOn}`, lang)}
          </p>
        )}
        {order.notes && !order.wantedOn && (
          <p className="pt-2 text-sm text-coal/70">{order.notes}</p>
        )}
      </div>

      {!cancelled && !unpaid && (
        <div className="text-left">
          <LocationContent />
        </div>
      )}

      {order.fulfillment === "pickup" && !cancelled && !unpaid && (
        <p className="text-sm text-coal/70">
          {t(
            "We'll text when your order is ready for pickup.",
            "Te avisaremos por mensaje cuando tu pedido esté listo para recoger.",
            lang,
          )}
        </p>
      )}

      {order.fulfillment === "delivery" && (
        <p className="text-sm text-coal/70">
          {t(
            "We'll deliver to your address within the Red Deer area. Watch for our text!",
            "Entregaremos en tu dirección en el área de Red Deer. ¡Espera nuestro mensaje!",
            lang,
          )}
        </p>
      )}

      <Link
        href="/order"
        className="inline-block rounded-full bg-berry px-8 py-3 font-semibold text-white hover:bg-berry-hover"
      >
        {t("Order again", "Pedir de nuevo", lang)}
      </Link>

      {user && canCustomerCancel(status) && (
        <div>
          <button
            type="button"
            disabled={cancelBusy}
            onClick={() => void cancelOrder()}
            className="text-sm text-coal/50 hover:text-berry hover:underline disabled:opacity-50"
          >
            {cancelBusy ? t("Cancelling…", "Cancelando…", lang) : t("Cancel order", "Cancelar pedido", lang)}
          </button>
          {cancelMsg && <p className="mt-2 text-sm text-coal/60">{cancelMsg}</p>}
        </div>
      )}
    </div>
  );
}
