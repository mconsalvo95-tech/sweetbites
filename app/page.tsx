import { HomePageContent } from "./HomeClient";
import { fetchCatalog } from "@/lib/catalog";
import { getWeeklyOffers } from "@/lib/weekly-offers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [promoSlides, catalog] = await Promise.all([getWeeklyOffers(), fetchCatalog()]);
  return <HomePageContent promoSlides={promoSlides} products={catalog.products} />;
}
