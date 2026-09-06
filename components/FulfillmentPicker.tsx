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
      descEn: "Collect at our Toronto shop",
      descEs: "Recoge en nuestra tienda de Toronto",
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
            className={`rounded-[18px] border-2 p-4 text-left transition-colors ${
              selected
                ? "border-[#C45C26] bg-white shadow-sm"
                : "border-transparent bg-white/70 hover:bg-white"
            }`}
          >
            <p className="font-display text-lg font-semibold text-[#2B1E14]">
              {lang === "es" ? opt.titleEs : opt.titleEn}
            </p>
            <p className="mt-1 text-sm text-[#2B1E14]/70">
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
      className="inline-block rounded-full bg-[#C45C26] px-8 py-3.5 text-center font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
    >
      {t("Start your order", "Empezar pedido", lang)}
    </Link>
  );
}
