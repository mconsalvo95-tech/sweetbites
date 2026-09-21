import { Suspense } from "react";
import { AccountClient } from "@/components/AccountClient";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-coal/60">Loading…</div>}>
      <AccountClient />
    </Suspense>
  );
}
