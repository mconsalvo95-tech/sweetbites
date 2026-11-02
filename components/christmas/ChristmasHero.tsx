"use client";

import { t } from "@/lib/format";
import { scrollToChristmasId } from "@/components/christmas/christmas-scroll";

const GARLAND_BULB_COLORS = ["#c4a35a", "#aa1d50", "#1f6b4a", "#ffd966", "#e7aca7", "#c4a35a"] as const;

function HeroGarland() {
  const bulbs = Array.from({ length: 16 }, (_, i) => ({
    x: 10 + i * 22,
    color: GARLAND_BULB_COLORS[i % GARLAND_BULB_COLORS.length],
    delay: (i % 5) * 0.35,
  }));

  return (
    <>
      <style>{`
        @keyframes christmas-hero-twinkle {
          0%, 100% { opacity: 0.5; filter: brightness(0.9); }
          50% { opacity: 1; filter: brightness(1.2); }
        }
        .christmas-hero-bulb {
          animation: christmas-hero-twinkle 1.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .christmas-hero-bulb { animation: none; opacity: 0.85; }
        }
      `}</style>
      <svg viewBox="0 0 360 40" className="h-10 w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M0 26 C50 10, 100 34, 150 20 S250 8, 300 22 S340 32, 360 18"
          fill="none"
          stroke="#1f6b4a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {bulbs.map((b, i) => (
          <g key={i} transform={`translate(${b.x}, ${22 + (i % 2 === 0 ? 5 : -3)})`}>
            <line x1="0" y1="-7" x2="0" y2="-2" stroke="#c4a35a" strokeWidth="1.2" />
            <ellipse
              className="christmas-hero-bulb"
              cx="0"
              cy="2"
              rx="4"
              ry="5.5"
              fill={b.color}
              style={{ animationDelay: `${b.delay}s` }}
            />
          </g>
        ))}
      </svg>
    </>
  );
}

function SweetShopWindow() {
  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-auto w-full max-w-[220px]" aria-hidden>
      <rect x="8" y="20" width="184" height="132" rx="6" fill="#fffaf8" stroke="#c4a35a" strokeWidth="2" />
      <rect x="8" y="20" width="184" height="28" rx="6" fill="#1f4d32" />
      <text x="100" y="39" textAnchor="middle" fill="#c4a35a" fontSize="11" fontWeight="bold">
        SWEET SHOP
      </text>
      <ellipse cx="100" cy="105" rx="38" ry="42" fill="#1f6b4a" />
      <polygon points="100,52 88,72 112,72" fill="#1f4d32" />
      <rect x="96" y="72" width="8" height="10" fill="#8f1744" />
      <circle cx="88" cy="98" r="5" fill="#aa1d50" opacity="0.9" />
      <circle cx="112" cy="100" r="4" fill="#c4a35a" />
      <circle cx="100" cy="118" r="4.5" fill="#ffd966" />
      <rect x="28" y="118" width="22" height="18" rx="2" fill="#aa1d50" />
      <rect x="33" y="118" width="12" height="18" fill="#c4a35a" opacity="0.7" />
      <rect x="150" y="120" width="20" height="16" rx="2" fill="#1f6b4a" />
      <path d="M160 120 C155 112 165 112 160 120" fill="#8f1744" />
      <path
        d="M16 28 C40 8 160 8 184 28"
        fill="none"
        stroke="#c4a35a"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* candy canes */}
      <path
        d="M24 145 Q24 130 34 130 Q44 130 44 145"
        fill="none"
        stroke="#aa1d50"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M168 145 Q168 132 176 132 Q184 132 184 145"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

type ChristmasHeroProps = { lang: "en" | "es" };

export function ChristmasHero({ lang }: ChristmasHeroProps) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-[#6d1138] via-[#8f1744] to-[#aa1d50] px-4 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, #c4a35a 2px, transparent 2px), radial-gradient(circle at 85% 60%, #ffd966 1.5px, transparent 1.5px)",
          backgroundSize: "56px 56px, 72px 72px",
        }}
      />
      <div
        className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#1f4d32]/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[#e7aca7]/15 blur-2xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <HeroGarland />
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr,minmax(180px,240px)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ffd966]/90">
              {t("SweetBites Christmas Shop", "Dulcería navideña SweetBites", lang)}
            </p>
            <h1 className="mt-3 font-display text-3xl uppercase leading-tight text-[#fffaf8] drop-shadow-md sm:text-4xl lg:text-[2.65rem]">
              {t("Christmas at SweetBites", "Navidad en SweetBites", lang)}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/92 sm:text-base">
              {t(
                "The sweetest season of the year is here. Discover festive treats, magical gift boxes and Christmas favourites made to share.",
                "La temporada más dulce del año llegó: dulces festivos, cajas mágicas y favoritos navideños para compartir.",
                lang,
              )}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="btn-primary rounded-xl border-2 border-[#c4a35a]/50 bg-[#fffaf8] px-5 py-3 text-sm font-bold text-[#8f1744] shadow-lg hover:bg-white"
                onClick={() => scrollToChristmasId("christmas-collection")}
              >
                {t("Shop Christmas treats", "Ver dulces de Navidad", lang)}
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-[#fffaf8]/40 bg-[#1f4d32]/90 px-5 py-3 text-sm font-bold text-[#fffaf8] shadow-md hover:bg-[#1f6b4a]"
                onClick={() => scrollToChristmasId("christmas-box")}
              >
                {t("Build your Christmas box", "Arma tu caja de Navidad", lang)}
              </button>
            </div>
          </div>
          <div className="relative hidden sm:block">
            <SweetShopWindow />
          </div>
        </div>
      </div>
    </header>
  );
}
