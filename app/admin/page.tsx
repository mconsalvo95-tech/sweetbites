import { Suspense } from "react";
import { AdminClient } from "@/components/AdminClient";

export default function AdminPage() {
  return (
    <div className="py-8">
      <Suspense fallback={<p className="text-center text-coal/60">Loading…</p>}>
        <AdminClient />
      </Suspense>
    </div>
  );
}
