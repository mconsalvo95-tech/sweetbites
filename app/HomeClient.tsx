"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/lang";
import { formatCad, pickDesc, pickName, t } from "@/lib/format";
import { PRODUCTS } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { HomeCta } from "@/components/FulfillmentPicker";
import { HomeSlider, type HomeSlide } from "@/components/HomeSlider";
import { InquiryForm } from "@/components/InquiryForm";
import { SocialLinks } from "@/components/SocialLinks";

const REVIEW_SLIDES: HomeSlide[] = [
  {
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8bdb8a950a?w=1200&q=80",
    quoteEn: "The brown butter cookies taste like they came straight from my grandma's oven.",
    quoteEs: "Las galletas de mantequilla dorada saben como si salieran del horno de mi abuela.",
    name: "Maya",
    cityEn: "Toronto",
    cityEs: "Toronto",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476f?w=1200&q=80",
    quoteEn: "Ordered a dozen for the office — gone in twenty minutes. Already planning the next round.",
    quoteEs: "Pedí una docena para la oficina — desapareció en veinte minutos. Ya planeo la siguiente.",
    name: "James",
    cityEn: "Mississauga",
    cityEs: "Mississauga",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80",
    quoteEn: "The cinnamon rolls are huge, soft, and actually worth the hype on Instagram.",
    quoteEs: "Los rollos de canela son enormes, suaves y valen la fama en Instagram.",
    name: "Sofia",
    cityEn: "Scarborough",
    cityEs: "Scarborough",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1587241321921-70a743c8916b?w=1200&q=80",
    quoteEn: "Shipped a gift box to my sister in Vancouver — arrived fresh and beautifully packed.",
    quoteEs: "Envié una caja regalo a mi hermana en Vancouver — llegó fresca y muy bien empacada.",
    name: "Priya",
    cityEn: "North York",
    cityEs: "North York",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1464349095432-e22a3ba1850c?w=1200&q=80",
    quoteEn: "Local delivery was quick and the fudge brownie was still warm. Instant repeat customer.",
    quoteEs: "La entrega local fue rápida y el brownie de fudge aún estaba tibio. Cliente fiel al instante.",
    name: "Carlos",
    cityEn: "Etobicoke",
    cityEs: "Etobicoke",
  },
];

const TOP_SLUGS = ["brown-butter-chocolate-chip", "fudge-brownie", "cinnamon-roll"];

function topSellers(products: Product[]) {
  return TOP_SLUGS.map(
    (slug) => products.find((p) => p.slug === slug) ?? PRODUCTS.find((p) => p.slug === slug)!,
  );
}

const VALUES = [
  {
    en: "Small batches, baked fresh",
    es: "Lotes pequeños, horneados frescos",
  },
  {
    en: "Real butter, seasonal flavors",
    es: "Mantequilla real, sabores de temporada",
  },
  {
    en: "Pickup, local delivery, or ship",
    es: "Recoger, entrega local o envío",
  },
];

export function HomePageContent({
  promoSlides,
  products,
}: {
  promoSlides: HomeSlide[];
  products: Product[];
}) {
  const { lang } = useLang();
  const sellers = topSellers(products);

  return (
    <>
      <div className="relative z-10 space-y-1">
        {promoSlides.length > 0 && (
          <HomeSlider
            slides={promoSlides}
            variant="promo"
            ariaLabelEn="Weekly promotions"
            ariaLabelEs="Promociones de la semana"
          />
        )}
        <HomeSlider
          slides={REVIEW_SLIDES}
          variant="review"
          ariaLabelEn="Customer reviews"
          ariaLabelEs="Reseñas de clientes"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 pt-6">
      {/* Short CTA under sliders */}
      <section className="text-center">
        <p className="text-base text-coal/75">
          {t(
            "Handmade cookies, brownies, and cakes — pickup, local delivery, or ship across Canada.",
            "Galletas, brownies y pasteles hechos a mano — recoger, entrega local o envío por Canadá.",
            lang,
          )}
        </p>
        <div className="mt-4">
          <HomeCta />
        </div>
      </section>

      {/* Top sellers */}
      <section>
        <h2 className="font-display text-xl uppercase text-coal">
          {t("Top sellers", "Más vendidos", lang)}
        </h2>
        <div className="mt-4 space-y-3">
          {sellers.map((product) => (
            <Link
              key={product.id}
              href={`/order/${product.slug}`}
              className="product-card flex gap-3 rounded-[18px] bg-white p-3 shadow-sm"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={product.imageUrl} alt="" fill unoptimized={product.imageUrl.startsWith("http")} className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-berry">{pickName(product, lang)}</p>
                <p className="line-clamp-1 text-sm text-coal/70">{pickDesc(product, lang)}</p>
                <p className="mt-1 text-sm font-bold text-berry">{formatCad(product.priceCents)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand values */}
      <section className="rounded-[18px] bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg uppercase text-coal">
          {t("Why Sweetbites", "Por qué Sweetbites", lang)}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-coal/80">
          {VALUES.map((v) => (
            <li key={v.en}>✦ {lang === "es" ? v.es : v.en}</li>
          ))}
        </ul>
      </section>

      {/* Promo strip */}
      <section className="rounded-[18px] bg-mint px-5 py-4 text-center shadow-sm">
        <p className="font-display text-lg uppercase text-coal">
          {t("Free pickup on orders $30+", "Recogida gratis en pedidos $30+", lang)}
        </p>
        <p className="mt-1 text-sm text-coal/75">
          {t("Local delivery $6 flat · Ships Canada-wide", "Entrega local $6 fijo · Envío a todo Canadá", lang)}
        </p>
      </section>

      {/* Social + subscribe */}
      <section className="rounded-[18px] bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg uppercase text-coal">
          {t("Follow along", "Síguenos", lang)}
        </h2>
        <SocialLinks lang={lang} className="mt-4" />
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-coal">
            {t("Get bakery updates", "Recibe novedades", lang)}
          </p>
          <InquiryForm type="newsletter" />
        </div>
      </section>
      </div>
    </>
  );
}
