"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModalProvider } from "@/components/ContactModal";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/lang";

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="relative z-10">
      <Header />
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

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <ContactModalProvider>
            <Shell>{children}</Shell>
          </ContactModalProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}
