"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { ChristmasMockProduct } from "@/lib/christmas-test";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";

type ChristmasDetailsModalProps = {
  product: ChristmasMockProduct | null;
  lang: "en" | "es";
  onClose: () => void;
  onAdd: (qty: number) => void;
};

export function ChristmasDetailsModal({
  product,
  lang,
  onClose,
  onAdd,
}: ChristmasDetailsModalProps) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) setQty(1);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const src = product.imageUrl.trim();
  const name = pickName(product, lang);
  const description = pickDesc(product, lang);

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="modal-panel relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[20px] border border-amber-600/25 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-coal/50 hover:text-coal"
          aria-label={t("Close", "Cerrar", lang)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl bg-blush/20">
          {src ? (
            <Image
              src={src}
              alt={name}
              fill
              unoptimized={src.startsWith("http")}
              className="object-cover"
              sizes="(max-width: 640px) 90vw, 384px"
            />
          ) : null}
        </div>

        <h2 className="mt-4 pr-8 font-display text-xl uppercase text-coal">{name}</h2>
        <p className="mt-2 text-sm text-coal/75">{description}</p>
        <p className="mt-3 text-lg font-bold text-berry">{formatCad(product.priceCents)}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-blush/80 bg-cream/60">
            <button
              type="button"
              className="px-3 py-2 text-lg text-berry disabled:opacity-40"
              aria-label={t("Decrease quantity", "Disminuir cantidad", lang)}
              disabled={qty <= 1}
              onClick={() => setQty((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              className="px-3 py-2 text-lg text-berry"
              aria-label={t("Increase quantity", "Aumentar cantidad", lang)}
              onClick={() => setQty((n) => n + 1)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="btn-primary flex-1 rounded-xl bg-berry px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => {
              onAdd(qty);
              onClose();
            }}
          >
            {t("Add to Christmas bag", "Agregar a la bolsa", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
