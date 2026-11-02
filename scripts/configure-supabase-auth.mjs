/**
 * Enable Google sign-in on the Supabase project and set auth redirect URLs.
 *
 * Requires in .env.local:
 *   SUPABASE_ACCESS_TOKEN  — Personal access token (Account → Access Tokens), not the service role key
 *   SUPABASE_PROJECT_REF
 *   NEXT_PUBLIC_SITE_URL   — e.g. https://sweetbites.shop
 *
 * Optional (needed to turn providers on):
 *   SUPABASE_AUTH_GOOGLE_CLIENT_ID
 *   SUPABASE_AUTH_GOOGLE_CLIENT_SECRET
 *
 * Usage: node scripts/configure-supabase-auth.mjs
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

/** @type {Record<string, string>} */
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const ref = env.SUPABASE_PROJECT_REF;
const token = env.SUPABASE_ACCESS_TOKEN;
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

if (!ref || !token) {
  console.error("Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const api = (p, init) =>
  fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

const redirects = [
  `${siteUrl}/auth/callback`,
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
].join(",");

/** @type {Record<string, unknown>} */
const patch = {
  site_url: siteUrl,
  uri_allow_list: redirects,
};

const googleId = env.SUPABASE_AUTH_GOOGLE_CLIENT_ID?.trim();
const googleSecret = env.SUPABASE_AUTH_GOOGLE_CLIENT_SECRET?.trim();
if (googleId && googleSecret) {
  patch.external_google_enabled = true;
  patch.external_google_client_id = googleId;
  patch.external_google_secret = googleSecret;
}

const getRes = await api("", { method: "GET" });
if (!getRes.ok) {
  console.error("GET auth config failed:", getRes.status, await getRes.text());
  console.error(
    "\nIf 401: create a new token at https://supabase.com/dashboard/account/tokens (scopes: auth:write).",
  );
  process.exit(1);
}

const before = await getRes.json();
console.log("Before:", {
  site_url: before.site_url,
  google: before.external_google_enabled,
});

if (!googleId) {
  console.error("\nNo Google OAuth client ID in .env.local — add SUPABASE_AUTH_GOOGLE_* then re-run.");
  process.exit(1);
}

const patchRes = await api("", { method: "PATCH", body: JSON.stringify(patch) });
if (!patchRes.ok) {
  console.error("PATCH failed:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const after = await patchRes.json();
console.log("After:", {
  site_url: after.site_url,
  uri_allow_list: after.uri_allow_list,
  google: after.external_google_enabled,
});
console.log("\nIn Google Cloud, set OAuth redirect URI to:");
console.log(`  ${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`);
