"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

const STORES = [
  {
    nameEn: "Morning Brew Café",
    nameEs: "Morning Brew Café",
    addrEn: "88 Queen St E, Toronto",
    addrEs: "88 Queen St E, Toronto",
    noteEn: "Cookie boxes + brownie bites",
    noteEs: "Cajas de galletas + brownie bites",
  },
  {
    nameEn: "The Pantry General",
    nameEs: "The Pantry General",
    addrEn: "412 Roncesvalles Ave, Toronto",
    addrEs: "412 Roncesvalles Ave, Toronto",
    noteEn: "Weekend pastry selection",
    noteEs: "Selección de pastelería de fin de semana",
  },
];

export default function StoresPage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Find us in stores", "Encuéntranos en tiendas", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {t("Grab Sweetbites at these local retailers.", "Consigue Sweetbites en estos comercios.", lang)}
        </p>
      </div>
      <div className="space-y-3">
        {STORES.map((store) => (
          <div key={store.nameEn} className="rounded-[18px] bg-white p-4 shadow-sm">
            <p className="font-display text-lg text-berry">
              {lang === "es" ? store.nameEs : store.nameEn}
            </p>
            <p className="mt-1 text-sm text-coal/75">
              {lang === "es" ? store.addrEs : store.addrEn}
            </p>
            <p className="text-sm text-coal/60">{lang === "es" ? store.noteEs : store.noteEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
