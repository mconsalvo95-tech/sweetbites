"use client";

import { t } from "@/lib/format";
import { scrollToChristmasId } from "@/components/christmas/christmas-scroll";

export type GiftGuideKey = "family" | "friends" | "special";

export const GIFT_GUIDE_HIGHLIGHTS: Record<GiftGuideKey, string[]> = {
  family: ["christmas-cookie-box", "holiday-brownie-box"],
  friends: ["gingerbread-bites"],
  special: ["festive-sweet-box"],
};

type ChristmasGiftGuideProps = {
  lang: "en" | "es";
  activeGuide: GiftGuideKey | null;
  onSelectGuide: (key: GiftGuideKey) => void;
};

const GUIDES: {
  key: GiftGuideKey;
  titleEn: string;
  titleEs: string;
  lineEn: string;
  lineEs: string;
}[] = [
  {
    key: "family",
    titleEn: "For family",
    titleEs: "Para la familia",
    lineEn: "Cozy classics to gather around the table.",
    lineEs: "Clásicos acogedores para la mesa en familia.",
  },
  {
    key: "friends",
    titleEn: "For friends",
    titleEs: "Para amigos",
    lineEn: "Playful bites that spark holiday cheer.",
    lineEs: "Bocados divertidos que encienden la alegría navideña.",
  },
  {
    key: "special",
    titleEn: "For someone special",
    titleEs: "Para alguien especial",
    lineEn: "A wrapped surprise worth unwrapping slowly.",
    lineEs: "Una sorpresa envuelta que merece abrirse despacio.",
  },
];

export function ChristmasGiftGuide({ lang, activeGuide, onSelectGuide }: ChristmasGiftGuideProps) {
  return (
    <section className="relative bg-[#1f4d32] px-4 py-12 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, #c4a35a 2px, transparent 2px), radial-gradient(circle at 78% 40%, #ffd966 1.5px, transparent 1.5px), radial-gradient(circle at 45% 75%, #c4a35a 1.5px, transparent 1.5px)",
          backgroundSize: "120px 120px, 90px 90px, 100px 100px",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl uppercase text-[#fffaf8] sm:text-3xl">
          {t("A sweet gift for every Christmas moment", "Un dulce regalo para cada momento navideño", lang)}
        </h2>
        <ul className="mt-8 grid list-none gap-4 sm:grid-cols-3">
          {GUIDES.map((g) => {
            const selected = activeGuide === g.key;
            return (
              <li key={g.key}>
                <article
                  className={`flex h-full flex-col rounded-2xl border-2 bg-white p-5 shadow-[0_8px_24px_rgba(31,77,50,0.12)] transition-shadow ${
                    selected ? "border-[#c4a35a] ring-2 ring-[#c4a35a]/40" : "border-[#1f6b4a]/20"
                  }`}
                >
                  <h3 className="font-display text-lg uppercase text-[#1f4d32]">
                    {t(g.titleEn, g.titleEs, lang)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-coal/75">
                    {t(g.lineEn, g.lineEs, lang)}
                  </p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-xl bg-[#1f4d32] px-4 py-2.5 text-sm font-semibold text-[#fffaf8] hover:bg-[#1f6b4a]"
                    onClick={() => {
                      onSelectGuide(g.key);
                      scrollToChristmasId("christmas-collection");
                    }}
                  >
                    {t("See picks", "Ver ideas", lang)}
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
