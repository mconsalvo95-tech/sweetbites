import Image from "next/image";

import { formatCad } from "@/lib/format";

type SpecialItemCardProps = {
  name: string;
  note?: string;
  priceCents: number | null;
  imageUrl: string;
};

export function SpecialItemCard({ name, note, priceCents, imageUrl }: SpecialItemCardProps) {
  const src = imageUrl.trim();

  return (
    <div className="product-card flex gap-3 rounded-xl bg-white p-3 shadow-[0_1px_5px_rgba(0,0,0,0.12)]">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blush/20">
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            unoptimized={src.startsWith("http")}
            className="object-cover"
            sizes="96px"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="text-base font-semibold leading-tight text-berry">{name}</h3>
          {note ? <p className="mt-1 line-clamp-2 text-sm text-coal/70">{note}</p> : null}
        </div>
        {priceCents != null ? (
          <p className="text-right text-sm font-bold text-berry">{formatCad(priceCents)}</p>
        ) : null}
      </div>
    </div>
  );
}
