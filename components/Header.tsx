import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";

const links = [
  { href: "/", labelEn: "Home", labelEs: "Inicio" },
  { href: "/order", labelEn: "Order", labelEs: "Pedir" },
  { href: "/location", labelEn: "Location", labelEs: "Ubicación" },
];

export function Header({ lang }: { lang: "en" | "es" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8dfd3] bg-[#F6F0E6]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold text-[#2B1E14]">
          Sweetbites
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#2B1E14]/80 hover:text-[#C45C26] transition-colors"
            >
              {lang === "es" ? link.labelEs : link.labelEn}
            </Link>
          ))}
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
