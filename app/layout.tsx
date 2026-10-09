import type { Metadata } from "next";
import { Lilita_One, Montserrat } from "next/font/google";
import { RootLayoutClient } from "./layout-client";
import { shop } from "@/lib/shop";
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

export const metadata: Metadata = {
  title: {
    default: shop.name,
    template: `%s | ${shop.name}`,
  },
  description: "Bakery and sweets in Red Deer, Alberta.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lilita.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
