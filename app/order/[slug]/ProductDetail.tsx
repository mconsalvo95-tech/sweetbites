"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";
import type { Product, ProductOption } from "@/lib/types";
import { parseProductImages, primaryProductImage } from "@/lib/product-images";

type Props = { product: Product; more: Product[] };

export function ProductDetail({ product, more }: Props) {
  const { lang } = useLang();
  const { addLine } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(product.options.map((o) => [o.id, []])),
  );
  const [error, setError] = useState("");
  const gallery = useMemo(() => {
    const parsed = product.imageUrls?.length
      ? product.imageUrls
      : parseProductImages(product.imageUrl);
    return parsed.length > 0 ? parsed : [primaryProductImage(product.imageUrl)];
  }, [product.imageUrl, product.imageUrls]);
  const [activeImage, setActiveImage] = useState(0);
  const heroUrl = gallery[activeImage] ?? gallery[0];
  const description = pickDesc(product, lang);

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
      imageUrl: gallery[0] ?? primaryProductImage(product.imageUrl),
      optionsJson,
    });

    router.push("/order");
  };

  return (
    <div className="relative z-10 space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-2">
          <div className="relative aspect-[16/10] max-h-[260px] overflow-hidden rounded-[20px] shadow-sm lg:aspect-square lg:max-h-none">
            <Image
              src={heroUrl}
              alt={pickName(product, lang)}
              fill
              unoptimized={heroUrl.startsWith("http")}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? "border-berry" : "border-transparent"
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized={url.startsWith("http")}
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-coal">
              {pickName(product, lang)}
            </h1>
            <p className="mt-3 text-xl font-semibold text-berry">
              {formatCad(product.priceCents)}
            </p>
          </div>

          {product.options.map((opt) => (
            <div key={opt.id} className="rounded-[18px] bg-white p-4 shadow-sm">
              <h2 className="font-medium text-coal">
                {lang === "es" ? opt.nameEs : opt.nameEn}
                {opt.required && <span className="text-berry"> *</span>}
              </h2>
              <p className="mt-1 text-xs text-coal/60">
                {t(`Choose up to ${opt.maxSelect}`, `Elige hasta ${opt.maxSelect}`, lang)}
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush/35 text-lg"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush/35 text-lg"
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
          {description ? (
            <p className="text-sm leading-relaxed text-coal/80">{description}</p>
          ) : null}
        </div>
      </div>

      {more.length > 0 && (
        <section>
          <h2 className="font-display text-sm uppercase tracking-wide text-berry">
            {t("More from our menu", "Más de nuestro menú", lang)}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {more.map((item) => {
              const src = primaryProductImage(item.imageUrl);
              return (
                <Link key={item.id} href={`/order/${item.slug}`} className="text-center">
                  <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl">
                    <Image
                      src={src}
                      alt={pickName(item, lang)}
                      fill
                      unoptimized={src.startsWith("http")}
                      className="object-cover"
                      sizes="180px"
                    />
                  </div>
                  <p className="mt-3 break-words text-sm font-semibold leading-snug text-berry">
                    {pickName(item, lang)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
