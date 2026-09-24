"use client";

import { useLang } from "@/lib/lang";
import { useSitePageBody, type FaqBody } from "@/lib/site-pages";

export default function FaqPage() {
  const { lang } = useLang();
  const { items } = useSitePageBody("faq") as FaqBody;

  return (
    <div className="relative z-10 space-y-6">
      <h1 className="font-display text-2xl uppercase text-coal">FAQ</h1>
      <div className="space-y-4">
        {items.map((faq) => (
          <div key={faq.qEn} className="rounded-[18px] bg-white p-4 shadow-sm">
            <h2 className="font-medium text-coal">{lang === "es" ? faq.qEs : faq.qEn}</h2>
            <p className="mt-2 text-sm text-coal/75">{lang === "es" ? faq.aEs : faq.aEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
