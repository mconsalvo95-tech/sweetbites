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
4. **Auth:** In Supabase → Authentication → Providers, enable **Google**
5. **URLs:** Set Site URL to `http://localhost:3000` (or production domain). Add redirect URL(s):
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

Without env vars the app uses the hardcoded catalog and writes orders to `.local-orders.json`. Login/signup pages still render with a message that auth is not configured.

## Customer accounts

- `/login` — email/password + Google
- `/signup` — create account (default role: customer)
- `/account` — orders, wholesale status, profile, placeholders for payments/addresses
- Guest checkout still works; logged-in orders attach `user_id` automatically

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
