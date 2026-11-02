"use client";

import { t } from "@/lib/format";
import { scrollToChristmasId } from "@/components/christmas/christmas-scroll";

type ChristmasPromoBandProps = { lang: "en" | "es" };

export function ChristmasPromoBand({ lang }: ChristmasPromoBandProps) {
  return (
    <section className="relative overflow-hidden bg-[#aa1d50] px-4 py-10 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden
        style={{
          backgroundImage: "repeating-linear-gradient(-45deg, #c4a35a 0, #c4a35a 1px, transparent 1px, transparent 12px)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="max-w-lg font-display text-xl uppercase leading-snug text-[#fffaf8] sm:text-2xl">
          {t(
            "Made for gifting, sharing and celebrating.",
            "Hecho para regalar, compartir y celebrar.",
            lang,
          )}
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl border-2 border-[#c4a35a] bg-[#fffaf8] px-6 py-3 text-sm font-bold text-[#8f1744] shadow-md hover:bg-white"
          onClick={() => scrollToChristmasId("christmas-collection")}
        >
          {t("Explore the collection", "Ver la colección", lang)}
        </button>
      </div>
    </section>
  );
}
