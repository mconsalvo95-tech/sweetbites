"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { HomeCta } from "@/components/FulfillmentPicker";
import { HomeSlider, type HomeSlide } from "@/components/HomeSlider";
import { InquiryForm } from "@/components/InquiryForm";
import { SocialLinks } from "@/components/SocialLinks";
import { useSitePageBody, type AboutBody } from "@/lib/site-pages";

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

export function HomePageContent({ promoSlides }: { promoSlides: HomeSlide[] }) {
  const { lang } = useLang();
  const about = useSitePageBody("about") as AboutBody;

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
        <section>
          <h2 className="font-display text-xl uppercase text-coal">
            {t("Our history", "Nuestra historia", lang)}
          </h2>
          {about.photo_url ? (
            <img src={about.photo_url} alt="" className="mt-4 aspect-[16/9] w-full rounded-[18px] object-cover" />
          ) : null}
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-coal/85">
            <p>{lang === "es" ? about.p1_es : about.p1_en}</p>
            <p>{lang === "es" ? about.p2_es : about.p2_en}</p>
          </div>
          <Link href="/about" className="mt-3 inline-block text-sm font-medium text-berry hover:underline">
            {t("Read more", "Leer más", lang)}
          </Link>
          <div className="mt-6">
            <HomeCta />
          </div>
        </section>

        <section className="rounded-[18px] bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg uppercase text-coal">
            {t("Follow us", "Síguenos", lang)}
          </h2>
          <SocialLinks lang={lang} className="mt-4" />
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-coal">
              {t("Get our newest updates", "Recibe nuestras novedades", lang)}
            </p>
            <InquiryForm type="newsletter" />
          </div>
        </section>
      </div>
    </>
  );
}
