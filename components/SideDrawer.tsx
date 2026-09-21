"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { shop, shopAddressLine } from "@/lib/shop";
import { SocialLinks } from "./SocialLinks";

const navLinks = [
  { href: "/", labelEn: "Home", labelEs: "Inicio" },
  { href: "/order", labelEn: "Order", labelEs: "Pedir" },
  { href: "/wholesale", labelEn: "Wholesale", labelEs: "Mayoreo" },
  { href: "/about", labelEn: "About", labelEs: "Nosotros" },
  { href: "/faq", labelEn: "FAQ", labelEs: "Preguntas" },
  { href: "/events", labelEn: "Events", labelEs: "Eventos" },
  { href: "/stores", labelEn: "Find us in stores", labelEs: "Tiendas" },
  { href: "/location", labelEn: "Location", labelEs: "Dónde estamos" },
  { href: "/contact", labelEn: "Contact", labelEs: "Contacto" },
];

type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  onContact: () => void;
};

export function SideDrawer({ open, onClose, onContact }: SideDrawerProps) {
  const { lang } = useLang();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-backdrop fixed inset-0 z-[60] bg-black/40 ${open ? "drawer-backdrop-open" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`drawer-panel fixed left-0 top-0 z-[70] flex h-full w-[min(320px,85vw)] flex-col bg-white shadow-xl ${open ? "drawer-panel-open" : "pointer-events-none -translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("Menu", "Menú", lang)}
        aria-hidden={!open}
      >
        <div className="relative bg-blush px-4 py-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-berry text-white"
            aria-label={t("Close menu", "Cerrar menú", lang)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link
            href="/"
            onClick={onClose}
            className="font-display font-display-pink text-3xl uppercase tracking-tight"
          >
            Sweetbites
          </Link>
        </div>

        <div className="flex flex-1 flex-col px-4 py-5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onContact();
            }}
            className="btn-primary w-full rounded-full bg-berry px-4 py-3 text-left text-sm font-medium text-white shadow-md hover:bg-berry-hover"
          >
            <span className="block font-semibold">{shop.name}</span>
            <span className="block text-white/90">{shopAddressLine()}</span>
          </button>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-coal">
              {t("Menu", "Menú", lang)}
            </h2>
            <div className="mt-1 h-px bg-berry/40" />
          </div>

          <nav className="mt-4 flex flex-col">
            {navLinks.map((link, i) => (
              <Link
                key={link.href + link.labelEn}
                href={link.href}
                onClick={onClose}
                className={`py-3 text-coal/85 transition-colors hover:text-berry ${i > 0 ? "border-t border-coal/10" : ""}`}
              >
                {lang === "es" ? link.labelEs : link.labelEn}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-coal/10 pt-4">
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="block py-2 text-coal/85 transition-colors hover:text-berry"
                >
                  {t("My account", "Mi cuenta", lang)}
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="block py-2 text-coal/85 transition-colors hover:text-berry"
                  >
                    {t("Shop admin", "Admin de la tienda", lang)}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="block w-full py-2 text-left text-coal/85 transition-colors hover:text-berry"
                >
                  {t("Sign out", "Cerrar sesión", lang)}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="block py-2 text-coal/85 transition-colors hover:text-berry"
              >
                {t("Sign in", "Iniciar sesión", lang)}
              </Link>
            )}
          </div>

          <div className="mt-auto pt-6">
            <SocialLinks lang={lang} className="mb-4 justify-center" />
            <button
              type="button"
              onClick={() => {
                onClose();
                onContact();
              }}
              className="btn-primary w-full rounded-full bg-berry px-5 py-3.5 text-sm font-medium text-white shadow-md hover:bg-berry-hover"
            >
              {t("Quick contact", "Contacto rápido", lang)}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
