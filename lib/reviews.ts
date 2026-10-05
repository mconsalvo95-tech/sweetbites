import { getSupabase } from "./supabase";
import type { HomeSlide } from "@/components/HomeSlider";

export const DEFAULT_REVIEW_IMAGE =
  "https://images.unsplash.com/photo-1558961363-fa8bdb8a950a?w=1200&q=80";

export type ReviewItem = {
  quote_en: string;
  quote_es: string;
  reviewer_name: string;
  city_en: string;
  city_es: string;
  image_url: string;
  active: boolean;
};

export const FALLBACK_REVIEW_ITEMS: ReviewItem[] = [
  {
    quote_en: "The brown butter cookies taste like they came straight from my grandma's oven.",
    quote_es: "Las galletas de mantequilla dorada saben como si salieran del horno de mi abuela.",
    reviewer_name: "Maya",
    city_en: "Toronto",
    city_es: "Toronto",
    image_url: DEFAULT_REVIEW_IMAGE,
    active: true,
  },
  {
    quote_en: "Ordered a dozen for the office — gone in twenty minutes. Already planning the next round.",
    quote_es: "Pedí una docena para la oficina — desapareció en veinte minutos. Ya planeo la siguiente.",
    reviewer_name: "James",
    city_en: "Mississauga",
    city_es: "Mississauga",
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476f?w=1200&q=80",
    active: true,
  },
  {
    quote_en: "The cinnamon rolls are huge, soft, and actually worth the hype on Instagram.",
    quote_es: "Los rollos de canela son enormes, suaves y valen la fama en Instagram.",
    reviewer_name: "Sofia",
    city_en: "Scarborough",
    city_es: "Scarborough",
    image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80",
    active: true,
  },
  {
    quote_en: "Shipped a gift box to my sister in Vancouver — arrived fresh and beautifully packed.",
    quote_es: "Envié una caja regalo a mi hermana en Vancouver — llegó fresca y muy bien empacada.",
    reviewer_name: "Priya",
    city_en: "North York",
    city_es: "North York",
    image_url: "https://images.unsplash.com/photo-1587241321921-70a743c8916b?w=1200&q=80",
    active: true,
  },
  {
    quote_en: "Local delivery was quick and the fudge brownie was still warm. Instant repeat customer.",
    quote_es: "La entrega local fue rápida y el brownie de fudge aún estaba tibio. Cliente fiel al instante.",
    reviewer_name: "Carlos",
    city_en: "Etobicoke",
    city_es: "Etobicoke",
    image_url: "https://images.unsplash.com/photo-1464349095432-e22a3ba1850c?w=1200&q=80",
    active: true,
  },
];

function toSlides(items: ReviewItem[]): HomeSlide[] {
  return items
    .filter((row) => row.active && row.quote_en.trim() && row.reviewer_name.trim())
    .map((row) => ({
      imageUrl: row.image_url || DEFAULT_REVIEW_IMAGE,
      quoteEn: row.quote_en,
      quoteEs: row.quote_es || row.quote_en,
      name: row.reviewer_name,
      cityEn: row.city_en,
      cityEs: row.city_es || row.city_en,
    }));
}

export async function getHomeReviews(): Promise<HomeSlide[]> {
  const supabase = getSupabase();
  if (!supabase) return toSlides(FALLBACK_REVIEW_ITEMS);

  const { data, error } = await supabase
    .from("site_pages")
    .select("body")
    .eq("slug", "reviews")
    .maybeSingle();

  const items = (data?.body as { items?: ReviewItem[] } | null)?.items;
  if (error || !items?.length) return toSlides(FALLBACK_REVIEW_ITEMS);
  return toSlides(items);
}
