"use client";

import { InquiryForm } from "@/components/InquiryForm";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export default function ContactPage() {
  const { lang } = useLang();

  return (
    <div className="relative z-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-coal">
          {t("Contact", "Contacto", lang)}
        </h1>
        <p className="mt-2 text-sm text-coal/75">
          {t(
            "Questions about an order or custom request? Send us a message.",
            "¿Preguntas sobre un pedido o algo personalizado? Escríbenos.",
            lang,
          )}
        </p>
      </div>
      <InquiryForm type="contact" />
    </div>
  );
}
