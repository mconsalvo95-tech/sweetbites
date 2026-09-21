"use client";



import type { Category } from "@/lib/types";



type Props = {

  categories: Category[];

  activeSlug: string;

  lang: "en" | "es";

  onSelect: (slug: string) => void;

};



export function CategoryChips({ categories, activeSlug, lang, onSelect }: Props) {

  return (

    <div className="sticky top-[57px] z-30 -mx-4 border-b border-blush/40 bg-white/95 px-4 py-3 backdrop-blur-sm">

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

        {categories.map((cat) => {

          const active = cat.slug === activeSlug;

          return (

            <button

              key={cat.id}

              type="button"

              onClick={() => onSelect(cat.slug)}

              className={`chip-btn shrink-0 rounded-full px-4 py-2 text-sm font-medium ${

                active

                  ? "chip-btn-active bg-berry text-white shadow-sm"

                  : "bg-blush/20 text-coal shadow-sm ring-1 ring-blush/40 hover:bg-blush/40"

              }`}

            >

              {lang === "es" ? cat.nameEs : cat.nameEn}

            </button>

          );

        })}

      </div>

    </div>

  );

}

