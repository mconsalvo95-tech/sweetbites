"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";
import type { Product, ProductOption } from "@/lib/types";

const SECOND_IMAGE =
  "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop";

type Props = { product: Product };

export function ProductDetail({ product }: Props) {
  const { lang } = useLang();
  const { addLine } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(product.options.map((o) => [o.id, []])),
  );
  const [error, setError] = useState("");

  const optionsValid = useMemo(() => {
    return product.options.every((opt) => {
      const picked = selections[opt.id] ?? [];
      if (opt.required && picked.length === 0) return false;
      if (picked.length > opt.maxSelect) return false;
      return true;
    });
  }, [product.options, selections]);

  const toggleOption = (opt: ProductOption, valueId: string) => {
    setSelections((prev) => {
      const current = prev[opt.id] ?? [];
      if (opt.maxSelect === 1) {
        return { ...prev, [opt.id]: [valueId] };
      }
      if (current.includes(valueId)) {
        return { ...prev, [opt.id]: current.filter((id) => id !== valueId) };
      }
      if (current.length >= opt.maxSelect) return prev;
      return { ...prev, [opt.id]: [...current, valueId] };
    });
  };

  const handleAdd = () => {
    if (!optionsValid) {
      setError(t("Please complete all options", "Completa todas las opciones", lang));
      return;
    }

    const optionsJson: Record<string, string[]> = {};
    for (const opt of product.options) {
      const ids = selections[opt.id] ?? [];
      const names = ids.map((id) => {
        const val = opt.values.find((v) => v.id === id);
        return lang === "es" ? val?.nameEs ?? id : val?.nameEn ?? id;
      });
      optionsJson[lang === "es" ? opt.nameEs : opt.nameEn] = names;
    }

    addLine({
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameEs: product.nameEs,
      qty,
      unitPriceCents: product.priceCents,
      imageUrl: product.imageUrl,
      optionsJson,
    });

    router.push("/order");
  };

  const benefits = [
    t("Baked fresh to order", "Horneado fresco al pedir", lang),
    t("Real butter, no shortcuts", "Mantequilla real, sin atajos", lang),
    t("Perfect for gifting", "Ideal para regalar", lang),
  ];

  const ingredients = t(
    "Unbleached flour, butter, cane sugar, eggs, vanilla, sea salt, chocolate (where applicable).",
    "Harina sin blanquear, mantequilla, azúcar de caña, huevos, vainilla, sal marina, chocolate (según aplique).",
    lang,
  );

  const reviews = [
    {
      name: "Maya T.",
      textEn: "These are dangerously good — the brown butter flavor is unreal.",
      textEs: "Están peligrosamente ricos — el sabor a mantequilla dorada es increíble.",
    },
    {
      name: "Carlos R.",
      textEn: "Ordered for pickup and they were still warm. Will order again!",
      textEs: "Pedí para recoger y aún estaban tibias. ¡Volveré a pedir!",
    },
  ];

  return (
    <div className="relative z-10 space-y-5">
      <div className="relative aspect-square overflow-hidden rounded-[20px] shadow-sm">
        <Image
          src={product.imageUrl}
          alt={pickName(product, lang)}
          fill
          unoptimized={product.imageUrl.startsWith("http")}
          className="object-cover"
          sizes="480px"
          priority
        />
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-coal">
          {pickName(product, lang)}
        </h1>
        <p className="mt-2 text-coal/75">{pickDesc(product, lang)}</p>
        <p className="mt-3 text-xl font-semibold text-berry">
          {formatCad(product.priceCents)}
        </p>
      </div>

      <div className="rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium text-coal">{t("Why you'll love it", "Por qué te encantará", lang)}</h2>
        <ul className="mt-2 space-y-1 text-sm text-coal/75">
          {benefits.map((b) => (
            <li key={b}>✦ {b}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium text-coal">{t("Ingredients", "Ingredientes", lang)}</h2>
        <p className="mt-2 text-sm text-coal/75">{ingredients}</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] shadow-sm">
        <Image
          src={SECOND_IMAGE}
          alt=""
          fill
          className="object-cover"
          sizes="480px"
        />
      </div>

      <div className="rounded-[18px] bg-white p-4 shadow-sm">
        <h2 className="font-medium text-coal">{t("Reviews", "Reseñas", lang)}</h2>
        <div className="mt-3 space-y-3">
          {reviews.map((r) => (
            <div key={r.name} className="border-t border-blush/30 pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-medium text-berry">{r.name}</p>
              <p className="mt-1 text-sm text-coal/75">
                {lang === "es" ? r.textEs : r.textEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {product.options.map((opt) => (
        <div key={opt.id} className="rounded-[18px] bg-white p-4 shadow-sm">
          <h2 className="font-medium text-coal">
            {lang === "es" ? opt.nameEs : opt.nameEn}
            {opt.required && <span className="text-berry"> *</span>}
          </h2>
          <p className="mt-1 text-xs text-coal/60">
            {t(
              `Choose up to ${opt.maxSelect}`,
              `Elige hasta ${opt.maxSelect}`,
              lang,
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opt.values.map((val) => {
              const picked = (selections[opt.id] ?? []).includes(val.id);
              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => toggleOption(opt, val.id)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    picked
                      ? "bg-berry text-white"
                      : "bg-blush/30 text-coal hover:bg-blush/50"
                  }`}
                >
                  {lang === "es" ? val.nameEs : val.nameEn}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 rounded-[18px] bg-white p-4 shadow-sm">
        <span className="text-sm font-medium">{t("Quantity", "Cantidad", lang)}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-lg"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-lg"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleAdd}
        className="btn-primary w-full rounded-full bg-berry py-3.5 font-semibold text-white shadow-md hover:bg-berry-hover"
      >
        {t("Add to cart", "Agregar al carrito", lang)}
      </button>
    </div>
  );
}
