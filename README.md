# Sweetbites

Phase 1 bakery ordering mockup — Next.js 15, Tailwind v4, Supabase-ready.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` then `supabase/seed.sql` in the SQL editor
3. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without env vars the app uses the hardcoded catalog and writes orders to `.local-orders.json`.

## Self-check

```bash
npm run self-check
```

## Deploy (Vercel)

```bash
npx vercel link
npx vercel env pull
npx vercel --prod
```

Connect the GitHub repo in the Vercel dashboard for preview deploys on push.
