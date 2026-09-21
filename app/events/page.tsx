"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

const EVENTS = [
  {
    nameEn: "Distillery Sunday Market",
    nameEs: "Mercado dominical Distillery",
    dateEn: "Oct 5, 2026 · 10am – 3pm",
    dateEs: "5 oct 2026 · 10am – 3pm",
    locEn: "Distillery District, Toronto",
    locEs: "Distillery District, Toronto",
  },
  {
    nameEn: "Leslieville Farmers Market",
    nameEs: "Mercado Leslieville",
    dateEn: "Oct 19, 2026 · 9am – 2pm",
    dateEs: "19 oct 2026 · 9am – 2pm",
    locEn: "Jonathan Ashbridge Park",
    locEs: "Parque Jonathan Ashbridge",
  },
];

export default function EventsPage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Events", "Eventos", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {t("Find us at these upcoming markets.", "Encuéntranos en estos mercados.", lang)}
        </p>
      </div>
      <div className="space-y-3">
        {EVENTS.map((ev) => (
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
