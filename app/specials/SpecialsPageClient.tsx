"use client";

import { ChristmasConcept } from "@/components/christmas/ChristmasConcept";
import { ChristmasSnow } from "@/components/ChristmasSnow";
import type { SpecialsBody } from "@/lib/specials";

export function SpecialsPageClient({ initial }: { initial: SpecialsBody }) {
  void initial;
  return (
    <div className="relative min-h-[40vh] overflow-x-hidden">
      <ChristmasSnow />
      <div className="relative z-10">
        <ChristmasConcept />
      </div>
    </div>
  );
}
