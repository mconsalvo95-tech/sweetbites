"use client";



import { useLang } from "@/lib/lang";



export function LanguageToggle() {

  const { lang, toggleLang } = useLang();



  return (

    <button

      type="button"

      onClick={toggleLang}

      className="lang-toggle rounded-full border border-berry/30 px-2.5 py-1 text-xs font-medium text-berry hover:bg-berry/10"

      aria-label="Toggle language"

    >

      {lang === "en" ? "ES" : "EN"}

    </button>

  );

}

