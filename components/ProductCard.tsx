import Image from "next/image";

import Link from "next/link";

import type { Product } from "@/lib/types";

import { formatCad, pickDesc, pickName } from "@/lib/format";



export function ProductCard({ product, lang }: { product: Product; lang: "en" | "es" }) {

  return (

    <Link

      href={`/order/${product.slug}`}

      className="product-card flex gap-3 rounded-xl bg-white p-3 shadow-[0_1px_5px_rgba(0,0,0,0.12)]"

    >

      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">

        <Image

          src={product.imageUrl}

          alt={pickName(product, lang)}

          fill
          unoptimized={product.imageUrl.startsWith("http")}

          className="object-cover"

          sizes="96px"

        />

      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">

        <div>

          <h3 className="text-base font-semibold leading-tight text-berry">

            {pickName(product, lang)}

          </h3>

          <p className="mt-1 line-clamp-2 text-sm text-coal/70">

            {pickDesc(product, lang)}

          </p>

        </div>

        <p className="text-right text-sm font-bold text-berry">

          {formatCad(product.priceCents)}

        </p>

      </div>

    </Link>

  );

}

