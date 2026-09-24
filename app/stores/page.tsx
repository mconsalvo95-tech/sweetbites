"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { useSitePageBody, type StoresBody } from "@/lib/site-pages";

export default function StoresPage() {
  const { lang } = useLang();
  const body = useSitePageBody("stores") as StoresBody;

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Find us in stores", "Encuéntranos en tiendas", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {lang === "es" ? body.intro_es : body.intro_en}
        </p>
      </div>
      <div className="space-y-3">
        {body.items.map((store) => (
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
