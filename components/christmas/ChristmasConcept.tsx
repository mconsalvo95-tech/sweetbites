"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ChristmasBagBar } from "@/components/christmas/ChristmasBagBar";
import {
  ChristmasBoxBuilder,
  type BoxTreatId,
} from "@/components/christmas/ChristmasBoxBuilder";
import { ChristmasDetailsModal } from "@/components/christmas/ChristmasDetailsModal";
import { ChristmasFarewell } from "@/components/christmas/ChristmasFarewell";
import {
  ChristmasGiftGuide,
  GIFT_GUIDE_HIGHLIGHTS,
  type GiftGuideKey,
} from "@/components/christmas/ChristmasGiftGuide";
import { ChristmasHero } from "@/components/christmas/ChristmasHero";
import { ChristmasProductCard } from "@/components/christmas/ChristmasProductCard";
import { ChristmasPromoBand } from "@/components/christmas/ChristmasPromoBand";
import { ChristmasScallopDivider } from "@/components/christmas/ChristmasScallopDivider";
import { CHRISTMAS_MOCK_PRODUCTS, type ChristmasMockProduct } from "@/lib/christmas-test";
import { t } from "@/lib/format";
import { useLang } from "@/lib/lang";

export function ChristmasConcept() {
  const { lang } = useLang();
  const [bagCount, setBagCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<ChristmasMockProduct | null>(null);
  const [boxItems, setBoxItems] = useState<BoxTreatId[]>([]);
  const [activeGuide, setActiveGuide] = useState<GiftGuideKey | null>(null);

  const highlightedIds = useMemo(() => {
    if (!activeGuide) return new Set<string>();
    return new Set(GIFT_GUIDE_HIGHLIGHTS[activeGuide]);
  }, [activeGuide]);

  const addToBag = useCallback(
    (qty: number) => {
      setBagCount((c) => c + qty);
      setToast(t("Added to your Christmas bag!", "¡Agregado a tu bolsa de Navidad!", lang));
    },
    [lang],
  );

  const addBoxToBag = useCallback(() => {
    if (boxItems.length === 0) return;
    addToBag(1);
  }, [boxItems.length, addToBag]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] max-w-[100vw] overflow-x-hidden sm:mx-0 sm:w-full">
      <ChristmasHero lang={lang} />
      <ChristmasScallopDivider from="#aa1d50" to="#fffaf8" />

      <ChristmasBagBar lang={lang} bagCount={bagCount} toast={toast} />

      <section
        id="christmas-collection"
        className="scroll-mt-28 bg-[#fffaf8] px-4 py-10 sm:px-8 sm:py-12"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl uppercase text-[#8f1744] sm:text-3xl">
              {t("The Christmas collection", "La colección de Navidad", lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-coal/70 sm:text-base">
              {t(
                "A handpicked selection of festive favourites from the SweetBites Christmas shop.",
                "Una selección especial de favoritos festivos de la dulcería navideña SweetBites.",
                lang,
              )}
            </p>
          </div>
          <ul className="grid list-none gap-5 sm:grid-cols-2">
            {CHRISTMAS_MOCK_PRODUCTS.map((product, index) => (
              <li key={product.id}>
                <ChristmasProductCard
                  product={product}
                  lang={lang}
                  festiveVariant={index % 2 === 0 ? "tag" : "ribbon"}
                  highlighted={highlightedIds.has(product.id)}
                  onAdd={addToBag}
                  onViewDetails={() => setDetailProduct(product)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ChristmasScallopDivider from="#fffaf8" to="#aa1d50" />
      <ChristmasPromoBand lang={lang} />
      <ChristmasScallopDivider from="#aa1d50" to="#f5f0eb" />

      <ChristmasBoxBuilder
        lang={lang}
        boxItems={boxItems}
        onBoxChange={setBoxItems}
        onAddBoxToBag={addBoxToBag}
      />

      <ChristmasScallopDivider from="#f5f0eb" to="#1f4d32" />
      <ChristmasGiftGuide
        lang={lang}
        activeGuide={activeGuide}
        onSelectGuide={setActiveGuide}
      />

      <ChristmasScallopDivider from="#1f4d32" to="#163d28" />
      <ChristmasFarewell lang={lang} />

      <ChristmasDetailsModal
        product={detailProduct}
        lang={lang}
        onClose={() => setDetailProduct(null)}
        onAdd={addToBag}
      />
    </div>
  );
}
