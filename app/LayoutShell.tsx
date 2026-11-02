"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModalProvider } from "@/components/ContactModal";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/lang";

type LayoutShellProps = {
  children: React.ReactNode;
  showSpecialsNav: boolean;
};

function Shell({ children, showSpecialsNav }: LayoutShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="relative z-10">
      <Header showSpecialsNav={showSpecialsNav} />
      <main
        className={`flex min-h-[calc(100vh-72px)] flex-col ${
          isHome ? "" : "mx-auto max-w-6xl px-4 pb-24 pt-6"
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function LayoutShell({ children, showSpecialsNav }: LayoutShellProps) {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <ContactModalProvider>
            <Shell showSpecialsNav={showSpecialsNav}>{children}</Shell>
          </ContactModalProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}
