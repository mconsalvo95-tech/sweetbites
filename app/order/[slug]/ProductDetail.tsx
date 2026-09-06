"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";
import type { Product, ProductOption } from "@/lib/types";

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

  return (
    <div className="space-y-5">
      <div className="relative aspect-square overflow-hidden rounded-[20px] shadow-sm">
        <Image
          src={product.imageUrl}
          alt={pickName(product, lang)}
          fill
          className="object-cover"
          sizes="480px"
          priority
        />
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-[#2B1E14]">
          {pickName(product, lang)}
        </h1>
        <p className="mt-2 text-[#2B1E14]/75">{pickDesc(product, lang)}</p>
        <p className="mt-3 text-xl font-semibold text-[#C45C26]">
          {formatCad(product.priceCents)}
        </p>
      </div>

      {product.options.map((opt) => (
        <div key={opt.id} className="rounded-[18px] bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#2B1E14]">
            {lang === "es" ? opt.nameEs : opt.nameEn}
            {opt.required && <span className="text-[#C45C26]"> *</span>}
          </h2>
          <p className="mt-1 text-xs text-[#2B1E14]/60">
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
                      ? "bg-[#C45C26] text-white"
                      : "bg-[#F6F0E6] text-[#2B1E14] hover:bg-[#ede4d8]"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F0E6] text-lg"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F0E6] text-lg"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-full bg-[#C45C26] py-3.5 font-semibold text-white shadow-md hover:bg-[#b35222] transition-colors"
      >
        {t("Add to cart", "Agregar al carrito", lang)}
      </button>
    </div>
  );
}
