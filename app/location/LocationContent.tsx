"use client";

import { useContactModal } from "@/components/ContactModal";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { shop } from "@/lib/shop";
import { SocialLinks } from "@/components/SocialLinks";
import { useSitePageBody, type LocationBody } from "@/lib/site-pages";

export function LocationContent() {
  const { lang } = useLang();
  const { openContact } = useContactModal();
  const body = useSitePageBody("location") as LocationBody;
  const hours = lang === "es" ? body.hours_es : body.hours_en;

  return (
    <div className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl font-semibold">
        {t("Location", "Ubicación", lang)}
      </h1>

      <div className="space-y-4 rounded-[18px] bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-medium text-berry">{shop.name}</h2>
          <p className="mt-2 text-coal/80">
            {body.cityLine}
            <br />
            {body.country}
          </p>
        </div>

        <div>
          <h2 className="font-medium">{t("Hours", "Horario", lang)}</h2>
          <ul className="mt-2 space-y-1 text-sm text-coal/80">
            {hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <SocialLinks lang={lang} />

        <button
          type="button"
          onClick={openContact}
          className="btn-primary w-full rounded-full bg-berry px-5 py-3 text-sm font-medium text-white hover:bg-berry-hover"
        >
          {t("Contact us", "Contáctanos", lang)}
        </button>

        {(lang === "es" ? body.placeholder_es : body.placeholder_en) ? (
          <p className="text-sm text-coal/60">
            {lang === "es" ? body.placeholder_es : body.placeholder_en}
          </p>
        ) : null}
      </div>
    </div>
  );
}
