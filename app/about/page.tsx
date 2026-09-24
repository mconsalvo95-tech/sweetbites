"use client";

import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { photoPlaceholder, useSitePageBody, type AboutBody } from "@/lib/site-pages";

export default function AboutPage() {
  const { lang } = useLang();
  const body = useSitePageBody("about") as AboutBody;

  return (
    <div className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl uppercase text-coal">
        {t("About", "Nosotros", lang)}
      </h1>
      {body.photo_url ? (
        <img src={body.photo_url} alt="" className="aspect-[4/3] w-full rounded-[18px] object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-[18px] bg-blush/30 text-sm text-coal/40">
          {photoPlaceholder(lang)}
        </div>
      )}
      <div className="space-y-3 text-sm leading-relaxed text-coal/85">
        <p>{lang === "es" ? body.p1_es : body.p1_en}</p>
        <p>{lang === "es" ? body.p2_es : body.p2_en}</p>
      </div>
    </div>
  );
}
