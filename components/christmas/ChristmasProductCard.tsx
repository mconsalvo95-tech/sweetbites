"use client";

import Image from "next/image";
import { useState } from "react";

import type { ChristmasMockProduct } from "@/lib/christmas-test";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";

type ChristmasProductCardProps = {
  product: ChristmasMockProduct;
  lang: "en" | "es";
  festiveVariant?: "ribbon" | "tag";
  highlighted?: boolean;
  onAdd: (qty: number) => void;
  onViewDetails: () => void;
};

function GiftTag({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[2]" aria-hidden>
      <svg viewBox="0 0 56 32" className="h-8 w-14 drop-shadow-sm">
        <path d="M4 8 L52 8 L48 28 L8 28 Z" fill="#fffaf8" stroke="#c4a35a" strokeWidth="1.2" />
        <circle cx="28" cy="8" r="5" fill="#1f6b4a" />
        <text x="28" y="22" textAnchor="middle" fill="#8f1744" fontSize="7" fontWeight="bold">
          {label.slice(0, 8)}
        </text>
      </svg>
    </div>
  );
}

function CornerRibbon() {
  return (
    <div className="pointer-events-none absolute -right-1 top-4 z-[2] h-16 w-8" aria-hidden>
      <div className="h-full w-full bg-[#aa1d50] shadow-md" style={{ clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)" }} />
      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 bg-[#c4a35a]" />
    </div>
  );
}

export function ChristmasProductCard({
  product,
  lang,
  festiveVariant = "tag",
  highlighted = false,
  onAdd,
  onViewDetails,
}: ChristmasProductCardProps) {
  const [qty, setQty] = useState(1);
  const src = product.imageUrl.trim();
  const name = pickName(product, lang);
  const description = pickDesc(product, lang);
  const tagLabel = lang === "es" ? "Regalo" : "Gift";

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-[#fffaf8] shadow-[0_10px_28px_rgba(143,23,68,0.12),0_2px_8px_rgba(31,77,50,0.08)] transition ring-offset-2 ${
        highlighted
          ? "border-[#c4a35a] ring-4 ring-[#c4a35a]"
          : "border-[#1f6b4a]/25 ring-1 ring-[#c4a35a]/20"
      }`}
    >
      {festiveVariant === "ribbon" ? <CornerRibbon /> : <GiftTag label={tagLabel} />}
      <div className="relative aspect-[4/3] w-full bg-[#f5f0eb]/80">
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            unoptimized={src.startsWith("http")}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-3 top-0 h-1 rounded-b bg-gradient-to-r from-[#c4a35a] via-[#1f6b4a] to-[#c4a35a]" />
      </div>
      <div className="relative flex flex-1 flex-col gap-3 border-t border-[#c4a35a]/15 bg-gradient-to-b from-white/60 to-[#fffaf8] p-3 sm:p-4">
        <div>
          <h3 className="text-base font-bold leading-tight text-[#8f1744]">{name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-coal/72">{description}</p>
        </div>
        <p className="text-right text-base font-bold text-[#1f4d32]">{formatCad(product.priceCents)}</p>

        <div className="flex items-center rounded-lg border border-[#e7aca7]/50 bg-white/80">
          <button
            type="button"
            className="min-h-[44px] px-3 py-2 text-lg text-[#8f1744] disabled:opacity-40"
            aria-label={t("Decrease quantity", "Disminuir cantidad", lang)}
            disabled={qty <= 1}
            onClick={() => setQty((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            className="min-h-[44px] px-3 py-2 text-lg text-[#8f1744]"
            aria-label={t("Increase quantity", "Aumentar cantidad", lang)}
            onClick={() => setQty((n) => n + 1)}
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-primary min-h-[44px] flex-1 rounded-xl bg-[#8f1744] px-3 py-2.5 text-sm font-semibold text-white shadow-md"
            onClick={() => onAdd(qty)}
          >
            {t("Add", "Agregar", lang)}
          </button>
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl border-2 border-[#1f6b4a]/30 bg-white px-3 py-2.5 text-sm font-semibold text-[#1f4d32] hover:bg-[#fffaf8]"
            onClick={onViewDetails}
          >
            {t("View details", "Ver detalles", lang)}
          </button>
        </div>
      </div>
    </article>
  );
}
