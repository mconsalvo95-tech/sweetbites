"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { useSitePageBody, type EventsBody } from "@/lib/site-pages";

export default function EventsPage() {
  const { lang } = useLang();
  const body = useSitePageBody("events") as EventsBody;

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Events", "Eventos", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {lang === "es" ? body.intro_es : body.intro_en}
        </p>
      </div>
      <div className="space-y-3">
        {body.items.map((ev) => (
          <div key={ev.nameEn} className="rounded-[18px] bg-white p-4 shadow-sm">
            <p className="font-display text-lg text-berry">
              {lang === "es" ? ev.nameEs : ev.nameEn}
            </p>
            <p className="mt-1 text-sm text-coal/75">
              {lang === "es" ? ev.dateEs : ev.dateEn}
            </p>
            <p className="text-sm text-coal/60">{lang === "es" ? ev.locEs : ev.locEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
