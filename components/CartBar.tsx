"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { formatCad, t } from "@/lib/format";

export function CartBar() {
  const { itemCount, foodTotalCents } = useCart();
  const { lang } = useLang();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2">
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-2xl bg-[#C45C26] px-5 py-3.5 text-white shadow-lg transition-transform hover:scale-[1.01]"
      >
        <span className="text-sm font-medium">
          {itemCount} {t("items", "artículos", lang)}
        </span>
        <span className="font-semibold">{formatCad(foodTotalCents)}</span>
        <span className="text-sm underline underline-offset-2">
          {t("View cart", "Ver carrito", lang)}
        </span>
      </Link>
    </div>
  );
}
