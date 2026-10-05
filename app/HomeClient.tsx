"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { HomeCta } from "@/components/FulfillmentPicker";
import { HomeSlider, type HomeSlide } from "@/components/HomeSlider";
import { InquiryForm } from "@/components/InquiryForm";
import { SocialLinks } from "@/components/SocialLinks";
import { useSitePageBody, type AboutBody } from "@/lib/site-pages";

export function HomePageContent({
  promoSlides,
  reviewSlides,
}: {
  promoSlides: HomeSlide[];
  reviewSlides: HomeSlide[];
}) {
  const { lang } = useLang();
  const about = useSitePageBody("about") as AboutBody;

  return (
    <div className="flex flex-1 flex-col">
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
          slides={reviewSlides}
          variant="review"
          ariaLabelEn="Customer reviews"
          ariaLabelEs="Reseñas de clientes"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-10 px-4 pt-6">
        <section>
          <h2 className="font-display text-xl uppercase text-coal">
            {t("Our history", "Nuestra historia", lang)}
          </h2>
          {about.photo_url ? (
            <img src={about.photo_url} alt="" className="mt-4 aspect-[16/9] w-full rounded-[18px] object-cover" />
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-coal/85">
            {lang === "es" ? about.p1_es : about.p1_en}
          </p>
          <Link href="/about" className="mt-3 inline-block text-sm font-medium text-berry hover:underline">
            {t("Read more", "Leer más", lang)}
          </Link>
          <div className="mt-6">
            <HomeCta />
          </div>
        </section>

        <section className="mt-auto rounded-[18px] bg-white p-5 shadow-sm">
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
    </div>
  );
}
