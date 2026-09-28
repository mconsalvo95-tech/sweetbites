"use client";

import Link from "next/link";

import { useLang } from "@/lib/lang";
import { useCart } from "@/lib/cart";
import { t } from "@/lib/format";
import { mapsSearchUrls } from "@/lib/shop";

import type { Fulfillment } from "@/lib/types";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

export function MapLinks({ query }: { query: string }) {
  const { lang } = useLang();
  const urls = mapsSearchUrls(query);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={urls.google}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-blush/40 px-3 py-1.5 text-xs font-medium text-coal hover:bg-blush/60"
      >
        <PinIcon />
        Google Maps
      </a>
      <a
        href={urls.apple}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-blush/40 px-3 py-1.5 text-xs font-medium text-coal hover:bg-blush/60"
      >
        <PinIcon />
        {t("Apple Maps", "Apple Maps", lang)}
      </a>
    </div>
  );
}

export function PickupHint() {
  const { lang } = useLang();
  return (
    <p className="text-sm text-coal/80">
      {t(
        "The pickup address will be sent in your order confirmation email.",
        "La dirección de recogida se enviará en el correo de confirmación del pedido.",
        lang,
      )}
    </p>
  );
}

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
      value: "ship",
      titleEn: "Ship with Canada Post",
      titleEs: "Enviar con Canada Post",
      descEn: "Nationwide shipping across Canada",
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
      {fulfillment === "pickup" && <PickupHint />}
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
