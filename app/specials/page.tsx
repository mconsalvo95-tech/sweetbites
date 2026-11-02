import { Suspense } from "react";
import { SpecialsPageClient } from "./SpecialsPageClient";
import { fetchSpecialsBody } from "@/lib/specials";

export const dynamic = "force-dynamic";

export default async function SpecialsPage() {
  const specials = await fetchSpecialsBody();
  return (
    <Suspense fallback={<div className="py-12 text-center text-coal/60">Loading…</div>}>
      <SpecialsPageClient initial={specials} />
    </Suspense>
  );
}
