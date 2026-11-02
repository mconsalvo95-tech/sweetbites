import { NextResponse } from "next/server";

async function googleEnabled(): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return false;

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const redirectTo = encodeURIComponent(`${site}/auth/callback`);

  const res = await fetch(
    `${baseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`,
    {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      redirect: "manual",
    },
  );

  if (res.status === 302 || res.status === 303) return true;
  const body = await res.text();
  return !body.toLowerCase().includes("provider is not enabled");
}

export async function GET() {
  const google = await googleEnabled();
  return NextResponse.json({ ok: true, google });
}
