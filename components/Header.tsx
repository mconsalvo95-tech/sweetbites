"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { LanguageToggle } from "./LanguageToggle";
import { SideDrawer } from "./SideDrawer";
import { useContactModal } from "./ContactModal";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

function AccountIcon() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const href = user ? "/account" : "/login";
  const label = user
    ? t("My account", "Mi cuenta", lang)
    : t("Sign in", "Iniciar sesión", lang);

  return (
    <Link
      href={href}
      className="flex h-9 w-9 items-center justify-center text-coal/80 transition-colors hover:text-berry"
      aria-label={label}
      aria-busy={loading}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M4.5 18.5C5.2 15.2 7.8 13 11 13C14.2 13 16.8 15.2 17.5 18.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}

function CartIcon() {
  const { itemCount } = useCart();
  const { lang } = useLang();

  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center text-coal/80 transition-colors hover:text-berry"
      aria-label={t("Cart", "Carrito", lang)}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M6 6H18L16.5 14.5C16.35 15.35 15.6 16 14.7 16H9.3C8.4 16 7.65 15.35 7.5 14.5L5.5 4.5H3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="18.5" r="1.25" fill="currentColor" />
        <circle cx="15" cy="18.5" r="1.25" fill="currentColor" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-berry px-1 text-[10px] font-semibold text-white">
        {itemCount}
      </span>
    </Link>
  );
}

export function Header() {
  const { lang } = useLang();
  const { openContact } = useContactModal();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-blush/50 bg-blush/95 backdrop-blur-sm">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-2 py-2 sm:px-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center justify-self-start text-coal/80 transition-colors hover:text-berry"
            aria-label={t("Open menu", "Abrir menú", lang)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path d="M4 6H18M4 11H18M4 16H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="justify-self-center">
            <Image
              src="/logos/wordmark.png"
              alt="Sweetbites"
              width={367}
              height={219}
              className="h-20 w-auto sm:h-24"
              priority
            />
          </Link>

          <div className="flex items-center justify-end gap-2">
            <AccountIcon />
            <CartIcon />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onContact={openContact}
      />
    </>
  );
}
