"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { pickName, t } from "@/lib/format";
import { parseProductImages, primaryProductImage } from "@/lib/product-images";

const photoNavBtn =
  "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-coal shadow opacity-0 transition pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100 hover:bg-white sm:h-9 sm:w-9";

export function ProductCard({ product, lang }: { product: Product; lang: "en" | "es" }) {
  const gallery = useMemo(() => {
    const parsed = product.imageUrls?.length
      ? product.imageUrls
      : parseProductImages(product.imageUrl);
    return parsed.length > 0 ? parsed : [primaryProductImage(product.imageUrl)];
  }, [product.imageUrl, product.imageUrls]);
  const [activeImage, setActiveImage] = useState(0);
  const imageSrc = gallery[activeImage] ?? gallery[0];
  const multi = gallery.length > 1;

  const stepPhoto = (delta: number, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImage((i) => (i + delta + gallery.length) % gallery.length);
  };

  return (
    <Link
      href={`/order/${product.slug}`}
      className="product-card group block overflow-hidden rounded-xl bg-white shadow-[0_1px_5px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={pickName(product, lang)}
          fill
          unoptimized={imageSrc.startsWith("http")}
          className="object-cover transition-transform group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {multi && (
          <>
            <button
              type="button"
              onClick={(e) => stepPhoto(-1, e)}
              className={`${photoNavBtn} left-2`}
              aria-label={t("Previous photo", "Foto anterior", lang)}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path
                  d="M11 4L6 9L11 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => stepPhoto(1, e)}
              className={`${photoNavBtn} right-2`}
              aria-label={t("Next photo", "Foto siguiente", lang)}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path
                  d="M7 4L12 9L7 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="px-2 py-3 text-center">
        <h3 className="text-sm font-semibold uppercase leading-snug text-coal">
          {pickName(product, lang)}
        </h3>
      </div>
    </Link>
  );
}
