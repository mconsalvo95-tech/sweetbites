"use client";

import Link from "next/link";

import { useLang } from "@/lib/lang";
import { useCart } from "@/lib/cart";
import { t } from "@/lib/format";

import type { Fulfillment } from "@/lib/types";

export function FulfillmentPicker() {
  const { fulfillment, setFulfillment } = useCart();
  const { lang } = useLang();

  const options: { value: Fulfillment; titleEn: string; titleEs: string; descEn: string; descEs: string }[] = [
    {
      value: "pickup",
      titleEn: "Pickup",
      titleEs: "Recoger",
      descEn: "Collect at our Red Deer kitchen",
      descEs: "Recoge en nuestra cocina de Red Deer",
    },
    {
      value: "delivery",
      titleEn: "Local delivery",
      titleEs: "Entrega local",
      descEn: "Red Deer-area delivery, flat $6",
      descEs: "Entrega en Red Deer, $6 fijo",
    },
    {
      value: "ship",
      titleEn: "Ship with Canada Post",
      titleEs: "Enviar con Canada Post",
      descEn: "Nationwide delivery across Canada",
      descEs: "Envío a todo Canadá",
    },
  ];

  return (
    <div className="grid gap-3">
      {options.map((opt) => {
        const selected = fulfillment === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFulfillment(opt.value)}
            className={`fulfillment-card rounded-[18px] border-2 p-4 text-left ${
              selected
                ? "fulfillment-card-selected"
                : "border-transparent bg-white/70 hover:bg-white"
            }`}
          >
            <p className="font-display text-lg uppercase text-coal">
              {lang === "es" ? opt.titleEs : opt.titleEn}
            </p>
            <p className="mt-1 text-sm text-coal/70">
              {lang === "es" ? opt.descEs : opt.descEn}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function HomeCta() {
  const { lang } = useLang();
  return (
    <Link
      href="/order"
      className="btn-primary inline-block rounded-full bg-berry px-8 py-3.5 text-center font-semibold text-white shadow-md hover:bg-berry-hover"
    >
      {t("Start your order", "Empezar pedido", lang)}
    </Link>
  );
}
