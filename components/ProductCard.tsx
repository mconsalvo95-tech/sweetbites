import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCad, pickDesc, pickName } from "@/lib/format";

export function ProductCard({ product, lang }: { product: Product; lang: "en" | "es" }) {
  return (
    <Link
      href={`/order/${product.slug}`}
      className="flex gap-3 rounded-[18px] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
        <Image
          src={product.imageUrl}
          alt={pickName(product, lang)}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight text-[#2B1E14]">
            {pickName(product, lang)}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-[#2B1E14]/70">
            {pickDesc(product, lang)}
          </p>
        </div>
        <p className="text-right text-sm font-semibold text-[#C45C26]">
          {formatCad(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}
