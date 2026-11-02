"use client";

import { t } from "@/lib/format";
import { scrollToChristmasId } from "@/components/christmas/christmas-scroll";

type ChristmasFarewellProps = { lang: "en" | "es" };

export function ChristmasFarewell({ lang }: ChristmasFarewellProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1f4d32] to-[#163d28] px-4 pb-14 pt-12 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle, #c4a35a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fffaf8]/20 to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-6xl text-center">
        <h2 className="font-display text-2xl uppercase text-[#fffaf8] sm:text-3xl">
          {t("Made with love, wrapped in Christmas magic.", "Hecho con amor, envuelto en magia navideña.", lang)}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#fffaf8]/85 sm:text-base">
          {t(
            "Find the perfect festive treats before the season melts away.",
            "Encuentra los dulces festivos perfectos antes de que se derrita la temporada.",
            lang,
          )}
        </p>
        <button
          type="button"
          className="mt-8 rounded-xl border-2 border-[#c4a35a] bg-[#fffaf8] px-8 py-3 text-sm font-bold text-[#8f1744] shadow-lg hover:bg-white"
          onClick={() => scrollToChristmasId("christmas-collection")}
        >
          {t("Shop Christmas", "Comprar Navidad", lang)}
        </button>

        <svg viewBox="0 0 400 80" className="mx-auto mt-10 h-20 w-full max-w-lg opacity-90" aria-hidden>
          <ellipse cx="200" cy="72" rx="180" ry="8" fill="#fffaf8" opacity="0.35" />
          <polygon points="60,70 70,35 80,70" fill="#1f6b4a" />
          <polygon points="65,45 70,30 75,45" fill="#aa1d50" />
          <polygon points="320,70 332,32 344,70" fill="#1f6b4a" />
          <polygon points="326,42 332,28 338,42" fill="#c4a35a" />
          <rect x="175" y="48" width="22" height="22" rx="2" fill="#aa1d50" />
          <rect x="183" y="48" width="6" height="22" fill="#c4a35a" />
          <rect x="175" y="56" width="22" height="6" fill="#c4a35a" />
          <rect x="205" y="52" width="18" height="18" rx="2" fill="#1f6b4a" />
          <path d="M214 52 C210 46 218 46 214 52" fill="#8f1744" />
        </svg>
      </div>
    </section>
  );
}
