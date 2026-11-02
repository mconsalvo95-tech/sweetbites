import { HomePageContent } from "./HomeClient";
import { getHomeReviews } from "@/lib/reviews";
import { fetchSpecialsBody } from "@/lib/specials";
import { getWeeklyOffers } from "@/lib/weekly-offers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [promoSlides, reviewSlides, specials] = await Promise.all([
    getWeeklyOffers(),
    getHomeReviews(),
    fetchSpecialsBody(),
  ]);
  return (
    <HomePageContent
      promoSlides={promoSlides}
      reviewSlides={reviewSlides}
      specials={specials}
    />
  );
}
