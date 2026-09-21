"use client";

import { InquiryForm } from "./InquiryForm";
import { SocialLinks } from "./SocialLinks";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

export function Footer() {
  const { lang } = useLang();

  return (
    <footer className="relative z-10 border-t border-blush/40 bg-cream/95 py-6">
      <div className="mx-auto max-w-6xl space-y-4 px-4">
        <div>
          <p className="text-sm font-medium text-coal">
            {t("Stay in the loop", "Mantente al día", lang)}
          </p>
          <div className="mt-2">
            <InquiryForm type="newsletter" compact />
          </div>
        </div>
        <SocialLinks lang={lang} className="justify-center" />
        <p className="text-center text-xs text-coal/50">
          © {new Date().getFullYear()} Sweetbites
        </p>
      </div>
    </footer>
  );
}
