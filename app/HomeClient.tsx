"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";
import { HomeCta } from "@/components/FulfillmentPicker";
import { HomeSlider, type HomeSlide } from "@/components/HomeSlider";
import { SocialLinks } from "@/components/SocialLinks";
import { SpecialsSection } from "@/components/SpecialsSection";
import { useSitePageBody, type AboutBody } from "@/lib/site-pages";
import { localDateIso } from "@/lib/shop";
import { specialIsVisible, type SpecialsBody } from "@/lib/specials";

function specialPromoSlide(body: SpecialsBody): HomeSlide {
  const imageUrl = body.image_url.trim();
  return {
    ...(imageUrl ? { imageUrl } : {}),
    titleEn: body.title_en || body.title_es,
    titleEs: body.title_es || body.title_en,
    offerEn: body.message_en || body.message_es,
    offerEs: body.message_es || body.message_en,
    offerLineClamp: true,
    ctaHref: "/specials",
    ctaLabelEn: "Specials",
    ctaLabelEs: "Especiales",
  };
}

export function HomePageContent({
  promoSlides,
  reviewSlides,
  specials,
}: {
  promoSlides: HomeSlide[];
  reviewSlides: HomeSlide[];
  specials?: SpecialsBody | null;
}) {
  const { lang } = useLang();
  const about = useSitePageBody("about") as AboutBody;

  const promoWithSpecial = useMemo(() => {
    if (!specials || !specialIsVisible(specials, localDateIso())) return promoSlides;
    return [specialPromoSlide(specials), ...promoSlides];
  }, [promoSlides, specials]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative z-10 space-y-1">
        {promoWithSpecial.length > 0 && (
          <HomeSlider
            slides={promoWithSpecial}
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

        <SpecialsSection initial={specials ?? undefined} />

        <section className="mt-auto rounded-[18px] bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg uppercase text-coal">
            {t("Follow us", "Síguenos", lang)}
          </h2>
          <SocialLinks lang={lang} className="mt-4 justify-center" />
        </section>
      </div>
    </div>
  );
}
