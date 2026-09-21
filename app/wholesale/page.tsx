"use client";

import { InquiryForm } from "@/components/InquiryForm";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export default function WholesalePage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Wholesale", "Mayoreo", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {t(
            "Cafés, offices, and events — tell us what you need and we'll get back to you.",
            "Cafés, oficinas y eventos — cuéntanos qué necesitas y te responderemos.",
            lang,
          )}
        </p>
      </div>
      <InquiryForm type="wholesale" />
    </div>
  );
}
