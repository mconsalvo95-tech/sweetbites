"use client";

import { Lilita_One, Montserrat } from "next/font/google";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModalProvider } from "@/components/ContactModal";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/lang";
import "./globals.css";

const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lilita",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lilita.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        <LangProvider>
          <AuthProvider>
            <CartProvider>
              <ContactModalProvider>
                <Shell>{children}</Shell>
              </ContactModalProvider>
            </CartProvider>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
