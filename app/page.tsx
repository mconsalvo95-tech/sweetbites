import { FulfillmentPicker, HomeCta } from "@/components/FulfillmentPicker";
import { HomeHero, HomeSectionTitle, FlavorTeaser } from "./HomeClient";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <HomeHero />
      <section>
        <HomeSectionTitle />
        <div className="mt-4">
          <FulfillmentPicker />
        </div>
      </section>
      <section className="rounded-[18px] bg-white p-5 shadow-sm">
        <FlavorTeaser />
      </section>
      <div className="pb-4 text-center">
        <HomeCta />
      </div>
    </div>
  );
}
