"use client";

import { InquiryForm } from "@/components/InquiryForm";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { useSitePageBody, type ContactBody } from "@/lib/site-pages";

export default function ContactPage() {
  const { lang } = useLang();
  const body = useSitePageBody("contact") as ContactBody;

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Contact", "Contacto", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {lang === "es" ? body.intro_es : body.intro_en}
        </p>
      </div>
      <InquiryForm type="contact" />
    </div>
  );
}
