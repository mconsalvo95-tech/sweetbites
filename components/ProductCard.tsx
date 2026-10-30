import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { pickName } from "@/lib/format";
import { primaryProductImage } from "@/lib/product-images";

export function ProductCard({ product, lang }: { product: Product; lang: "en" | "es" }) {
  const imageSrc = primaryProductImage(product.imageUrl);

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
      </div>
      <div className="px-2 py-3 text-center">
        <h3 className="text-sm font-semibold uppercase leading-snug text-coal">
          {pickName(product, lang)}
        </h3>
      </div>
    </Link>
  );
}
