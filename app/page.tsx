import { HomePageContent } from "./HomeClient";
import { getHomeReviews } from "@/lib/reviews";
import { getWeeklyOffers } from "@/lib/weekly-offers";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [promoSlides, reviewSlides] = await Promise.all([getWeeklyOffers(), getHomeReviews()]);
  return <HomePageContent promoSlides={promoSlides} reviewSlides={reviewSlides} />;
}
