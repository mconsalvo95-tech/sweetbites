"use client";

import { useLang } from "@/lib/lang";

export function LanguageToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="rounded-full border border-[#C45C26]/30 px-2.5 py-1 text-xs font-medium text-[#C45C26] hover:bg-[#C45C26]/10 transition-colors"
      aria-label="Toggle language"
    >
      {lang === "en" ? "ES" : "EN"}
    </button>
  );
}
