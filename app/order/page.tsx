"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CartBar } from "@/components/CartBar";
import { CategoryChips } from "@/components/CategoryChips";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, PRODUCTS, fetchCatalog } from "@/lib/catalog";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export default function OrderPage() {
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "cookies");

  useEffect(() => {
    void fetchCatalog().then((catalog) => {
      setCategories(catalog.categories);
      setProducts(catalog.products);
    });
  }, []);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const grouped = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      products: products.filter((p) => p.categoryId === cat.id),
    }));
  }, [categories, products]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id.startsWith("cat-")) {
          setActiveSlug(visible.target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [grouped]);

  const scrollTo = (slug: string) => {
    setActiveSlug(slug);
    sectionRefs.current[slug]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <h1 className="font-display font-display-pink text-2xl uppercase">
        {t("Menu", "Menú", lang)}
      </h1>
      <p className="mt-1 text-sm text-coal/70">
        {t("Tap a item to customize", "Toca un producto para personalizar", lang)}
      </p>

      <CategoryChips
        categories={categories}
        activeSlug={activeSlug}
        lang={lang}
        onSelect={scrollTo}
      />

      <div className="mt-4 space-y-8">
        {grouped.map(({ category, products: catProducts }) => (
          <section
            key={category.id}
            id={`cat-${category.slug}`}
            ref={(el) => {
              sectionRefs.current[category.slug] = el;
            }}
            className="scroll-mt-32"
          >
            <h2 className="font-display mb-3 rounded-xl bg-berry px-4 py-2.5 text-center text-lg uppercase text-white">
              {lang === "es" ? category.nameEs : category.nameEn}
            </h2>
            <div className="space-y-3">
              {catProducts.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CartBar />
    </>
  );
}
