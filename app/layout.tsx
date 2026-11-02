import type { Metadata, Viewport } from "next";
import { Lilita_One, Montserrat } from "next/font/google";
import { LayoutShell } from "./LayoutShell";
import { fetchSpecialsBody, specialIsVisible } from "@/lib/specials";
import { localDateIso, shop } from "@/lib/shop";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const specials = await fetchSpecialsBody();
  const showSpecialsNav = specialIsVisible(specials, localDateIso());

  return (
    <html lang="en" className={`${lilita.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        <LayoutShell showSpecialsNav={showSpecialsNav}>{children}</LayoutShell>
      </body>
    </html>
  );
}
