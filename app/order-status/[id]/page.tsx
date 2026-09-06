"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/lib/lang";
import { formatCad, pickName, t } from "@/lib/format";
import type { CartLine, Fulfillment, Lang } from "@/lib/types";

type OrderView = {
  id: string;
  fulfillment: Fulfillment;
  lang: Lang;
  customerName: string;
  foodCents: number;
  shippingCents: number;
  totalCents: number;
  items: CartLine[];
  serviceCode?: string;
  serviceNameEn?: string;
  serviceNameEs?: string;
};

export default function OrderStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { lang } = useLang();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/orders/${id}`);
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
  }, [id]);

  if (loading) {
    return <p className="text-center text-[#2B1E14]/70">{t("Loading…", "Cargando…", lang)}</p>;
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p>{t("Order not found", "Pedido no encontrado", lang)}</p>
        <Link href="/" className="mt-4 inline-block text-[#C45C26] underline">
          {t("Back home", "Volver al inicio", lang)}
        </Link>
      </div>
    );
  }

  const serviceName =
    lang === "es" ? order.serviceNameEs : order.serviceNameEn;

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-full bg-[#C45C26]/10 px-4 py-2 text-sm font-medium text-[#C45C26] inline-block">
        ✓ {t("Order received", "Pedido recibido", lang)}
      </div>

      <h1 className="font-display text-2xl font-semibold">
        {t("We got your order", "Recibimos tu pedido", lang)} #{order.id.slice(0, 8)}
      </h1>

      <p className="text-[#2B1E14]/75">
        {t(
          `Thanks ${order.customerName}! We'll reach you at the number you provided.`,
          `¡Gracias ${order.customerName}! Te contactaremos al número que nos diste.`,
          lang,
        )}
      </p>

      <div className="rounded-[18px] bg-white p-5 text-left shadow-sm space-y-3">
        <h2 className="font-medium">{t("Summary", "Resumen", lang)}</h2>
        {order.items.map((item) => (
          <div key={item.lineId} className="flex justify-between text-sm">
            <span>
              {item.qty}× {pickName(item, lang)}
            </span>
            <span>{formatCad(item.unitPriceCents * item.qty)}</span>
          </div>
        ))}
        <div className="border-t border-[#e8dfd3] pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t("Food", "Comida", lang)}</span>
            <span>{formatCad(order.foodCents)}</span>
          </div>
          {order.fulfillment === "ship" && (
            <>
              <div className="flex justify-between">
                <span>{t("Shipping (mock)", "Envío (simulado)", lang)}</span>
                <span>{formatCad(order.shippingCents)}</span>
              </div>
              {serviceName && (
                <p className="text-xs text-[#2B1E14]/60">
                  {t(
                    `Quoted as ${serviceName} — ${formatCad(order.shippingCents)} (mock).`,
                    `Cotizado como ${serviceName} — ${formatCad(order.shippingCents)} (simulado).`,
                    lang,
                  )}
                </p>
              )}
            </>
          )}
          <div className="flex justify-between font-semibold text-base pt-1">
            <span>{t("Total", "Total", lang)}</span>
            <span className="text-[#C45C26]">{formatCad(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {order.fulfillment === "pickup" && (
        <p className="text-sm text-[#2B1E14]/70">
          {t(
            "Pickup at 124 King Street W, Toronto. We'll text when it's ready.",
            "Recoge en 124 King Street W, Toronto. Te avisaremos por mensaje cuando esté listo.",
            lang,
          )}
        </p>
      )}

      <Link
        href="/order"
        className="inline-block rounded-full bg-[#C45C26] px-8 py-3 font-semibold text-white"
      >
        {t("Order again", "Pedir de nuevo", lang)}
      </Link>
    </div>
  );
}
