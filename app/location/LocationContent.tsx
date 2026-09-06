"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export function LocationContent() {
  const { lang } = useLang();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">
        {t("Location", "Ubicación", lang)}
      </h1>

      <div className="rounded-[18px] bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-medium text-[#C45C26]">Sweetbites</h2>
          <p className="mt-2 text-[#2B1E14]/80">
            124 King Street W<br />
            Toronto, ON M5V 2T6<br />
            Canada
          </p>
        </div>

        <div>
          <h2 className="font-medium">{t("Hours", "Horario", lang)}</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#2B1E14]/80">
            <li>{t("Mon–Fri: 8am – 6pm", "Lun–Vie: 8am – 6pm", lang)}</li>
            <li>{t("Sat: 9am – 5pm", "Sáb: 9am – 5pm", lang)}</li>
            <li>{t("Sun: 10am – 3pm", "Dom: 10am – 3pm", lang)}</li>
          </ul>
        </div>

        <p className="text-sm text-[#2B1E14]/60">
          {t(
            "Placeholder address for the mockup. Real shop details coming soon.",
            "Dirección provisional para el mockup. Pronto los datos reales de la tienda.",
            lang,
          )}
        </p>
      </div>
    </div>
  );
}
