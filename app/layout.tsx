"use client";

import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import { LangProvider, useLang } from "@/lib/lang";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

function Shell({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  return (
    <>
      <Header lang={lang} />
      <main className="mx-auto min-h-[calc(100vh-57px)] max-w-[480px] px-4 pb-24 pt-6">
        {children}
      </main>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="antialiased">
        <LangProvider>
          <CartProvider>
            <Shell>{children}</Shell>
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
