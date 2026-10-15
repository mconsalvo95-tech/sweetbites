import { getSupabase } from "./supabase";
import type { HomeSlide } from "@/components/HomeSlider";

export const FALLBACK_PROMO_SLIDES: HomeSlide[] = [
  {
    imageUrl: "/test-images/swb-banner.png",
    tagEn: "This week",
    tagEs: "Esta semana",
    titleEn: "Cookie dozen deal",
    titleEs: "Docena de galletas",
    offerEn: "Buy 11, get 12 — mix any flavors from the menu.",
    offerEs: "Compra 11, lleva 12 — mezcla los sabores del menú.",
    ctaHref: "/order",
  },
  {
    imageUrl: "/test-images/img-1128.jpeg",
    tagEn: "This week",
    tagEs: "Esta semana",
    titleEn: "Brownie bundle",
    titleEs: "Pack de brownies",
    offerEn: "Three fudge brownies for $14 — perfect for sharing.",
    offerEs: "Tres brownies de fudge por $14 — ideal para compartir.",
    ctaHref: "/order",
  },
  {
    imageUrl: "/test-images/photoroom-140123.jpg",
    tagEn: "This week",
    tagEs: "Esta semana",
    titleEn: "Weekend cinnamon rolls",
    titleEs: "Rollos de canela del finde",
    offerEn: "Fresh-baked Saturday & Sunday — pre-order by Friday noon.",
    offerEs: "Horneados sábado y domingo — reserva antes del viernes al mediodía.",
    ctaHref: "/order",
  },
  {
    imageUrl: "/test-images/photoroom-140003.jpg",
    tagEn: "This week",
    tagEs: "Esta semana",
    titleEn: "Free pickup over $30",
    titleEs: "Recogida gratis desde $30",
    offerEn: "Skip the delivery fee when you pick up at our kitchen.",
    offerEs: "Sin cargo de entrega cuando recoges en nuestra cocina.",
    ctaHref: "/order",
  },
];

export async function getWeeklyOffers(): Promise<HomeSlide[]> {
  const supabase = getSupabase();
  if (!supabase) return FALLBACK_PROMO_SLIDES;

  const { data, error } = await supabase
    .from("weekly_offers")
    .select("image_url, tag_en, tag_es, title_en, title_es, offer_en, offer_es, cta_href")
    .eq("active", true)
    .order("sort");

  if (error) return FALLBACK_PROMO_SLIDES;
  if (!data?.length) return [];

  return data.map((row) => ({
    imageUrl: row.image_url,
    tagEn: row.tag_en ?? undefined,
    tagEs: row.tag_es ?? undefined,
    titleEn: row.title_en,
    titleEs: row.title_es,
    offerEn: row.offer_en,
    offerEs: row.offer_es,
    ctaHref: row.cta_href,
  }));
}
