"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export function HomeHero() {
  const { lang } = useLang();
  return (
    <section className="text-center">
      <p className="text-sm uppercase tracking-widest text-[#C45C26]">
        {t("Toronto bakery", "Panadería en Toronto", lang)}
      </p>
      <h1 className="font-display mt-2 text-4xl font-semibold leading-tight text-[#2B1E14]">
        Sweetbites
      </h1>
      <p className="mt-3 text-base text-[#2B1E14]/75">
        {t(
          "Small-batch cookies, brownies, and cakes baked with real butter and seasonal flavors.",
          "Galletas, brownies y pasteles artesanales con mantequilla real y sabores de temporada.",
          lang,
        )}
      </p>
    </section>
  );
}

export function HomeSectionTitle() {
  const { lang } = useLang();
  return (
    <h2 className="font-display text-xl font-semibold text-[#2B1E14]">
      {t("How do you want it?", "¿Cómo lo quieres?", lang)}
    </h2>
  );
}

export function FlavorTeaser() {
  const { lang } = useLang();
  return (
    <>
      <h2 className="font-display text-lg font-semibold text-[#2B1E14]">
        {t("This week’s favorites", "Favoritos de la semana", lang)}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-[#2B1E14]/80">
        <li>🍫 {t("Salted caramel brownie box", "Caja de brownies caramelo salado", lang)}</li>
        <li>🍪 {t("Brown butter chocolate chip", "Chispas de chocolate con mantequilla dorada", lang)}</li>
        <li>🥐 {t("Morning croissant + cinnamon roll", "Croissant matutino + rollo de canela", lang)}</li>
      </ul>
    </>
  );
}
