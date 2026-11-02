"use client";

import { useEffect, useMemo, useState } from "react";
import { CartBar } from "@/components/CartBar";
import { SpecialsSection } from "@/components/SpecialsSection";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, PRODUCTS, fetchCatalog } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const ALL_SLUG = "all";

export default function OrderPage() {
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [activeSlug, setActiveSlug] = useState(ALL_SLUG);

  useEffect(() => {
    void fetchCatalog().then((catalog) => {
      setCategories(catalog.categories);
      setProducts(catalog.products);
    });
  }, []);

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => products.some((p) => p.categoryId === cat.id));
  }, [categories, products]);

  const displayedProducts = useMemo(() => {
    if (activeSlug === ALL_SLUG) return products;
    const cat = categories.find((c) => c.slug === activeSlug);
    if (!cat) return products;
    return products.filter((p) => p.categoryId === cat.id);
  }, [activeSlug, categories, products]);

  const categoryNav = (
    <nav aria-label={t("Browse by category", "Explorar por categoría", lang)}>
      <h2 className="mb-3 hidden text-sm font-semibold uppercase tracking-wide text-coal md:block">
        {t("Browse by category", "Explorar por categoría", lang)}
      </h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-y-2">
        <li>
          <button
            type="button"
            onClick={() => setActiveSlug(ALL_SLUG)}
            className={`text-left text-sm text-coal hover:text-berry ${
              activeSlug === ALL_SLUG ? "font-bold" : "font-normal"
            }`}
          >
            {t("All items", "Todos los productos", lang)}
          </button>
        </li>
        {visibleCategories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setActiveSlug(cat.slug)}
                className={`text-left text-sm text-coal hover:text-berry ${
                  active ? "font-bold" : "font-normal"
                }`}
              >
                {lang === "es" ? cat.nameEs : cat.nameEn}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <h1 className="font-display font-display-pink text-2xl uppercase">
        {t("Menu", "Menú", lang)}
      </h1>
      <p className="mt-1 text-sm text-coal/70">
        {t("Tap an item to customize", "Toca un producto para personalizar", lang)}
      </p>

      <div className="mt-4">
        <SpecialsSection />
      </div>

      <div className="mt-6 md:mt-8 md:flex md:gap-10 lg:gap-14">
        <aside className="mb-6 shrink-0 md:mb-0 md:w-44 lg:w-52">{categoryNav}</aside>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </div>
      </div>

      <CartBar />
    </>
  );
}
