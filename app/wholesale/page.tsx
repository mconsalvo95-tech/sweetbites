"use client";

import { InquiryForm } from "@/components/InquiryForm";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { useSitePageBody, type WholesaleBody } from "@/lib/site-pages";

export default function WholesalePage() {
  const { lang } = useLang();
  const body = useSitePageBody("wholesale") as WholesaleBody;

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Wholesale", "Mayoreo", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {lang === "es" ? body.intro_es : body.intro_en}
        </p>
      </div>
      <InquiryForm type="wholesale" />
    </div>
  );
}
