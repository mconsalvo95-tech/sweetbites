import { HomePageContent } from "./HomeClient";
import { getWeeklyOffers } from "@/lib/weekly-offers";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const promoSlides = await getWeeklyOffers();
  return <HomePageContent promoSlides={promoSlides} />;
}
