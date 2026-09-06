# Bakery ordering mockup — plan

Review this, mark what to change, then implement with Composer 2.5.

Goal: a clickable site that *feels* like [Beiked](https://www.beiked.co/pedir) and [Menüpp bakery menus](https://menupp.co/cofibyifbakery/venue/N5w4sPGp67DELR8XMu2N/menu/2aIjng6Hk2emQuXJfiMs) so the client can say yes/no on structure, style, flow, font. Not a clone of their copy or photos. Not a full restaurant OS.

Shipping: Canada Post [Solutions for Small Business](https://www.canadapost-postescanada.ca/cpc/en/small-business.page) — her account. See the shipping section; Snap Ship is not a website plugin.

---

## What those sites actually are

Shared pattern (this is what we copy):

- Mobile-first ordering page, not a marketing brochure
- Sticky header: logo, Home / Order / Location
- Horizontal category chips that jump the page (Cookies, Brownies, Cakes, Gelato…)
- Product cards: photo, name, short description, price, tap to configure
- Product sheet: extras / flavor picks (box of 4 → pick 4 flavors), add to cart
- Persistent cart (badge + bottom bar on mobile)
- Fulfillment first: pickup vs ship, then menu
- Soft bakery look: cream paper background, warm brown type, one accent, big food photos, rounded cards, lots of whitespace
- Language switch: English / Spanish

What we do **not** copy: their products, photos, brand name, or platform chrome (Justo / Menüpp).

---

## Recommended defaults (change these if wrong)

| Decision | Default | Why |
|---|---|---|
| Market | Canada | Her carrier is Canada Post |
| Language | English + Spanish toggle | You asked for a switch |
| Currency | CAD `$18.90` | Canadian checkout |
| Brand | **Sweetbites** (placeholder logo/colors until she sends assets) | Confirmed |
| Catalog | Fake bakery menu, ~12 products, 4 categories | Enough to judge layout |
| Photos | Unsplash / placeholder food shots | Real photos later |
| Phase 1 | Browse + cart + mock checkout → Supabase order | Client can tap through |
| Payments | None in mockup | YAGNI until they like the look |
| Auth | Guest checkout | Login is extra surface |
| Admin | None in mockup | Seed data; dashboard after approval |
| Fulfillment | **Both:** pickup and Canada Post ship | Confirmed |
| Canada Post account | Solutions for Small Business (no commercial contract) | Confirmed |
| Canada Post API keys | Unknown — ask her later | Not needed for phase 1 |
| Origin (mock) | Toronto `M5V 2T6` | Confirmed until she gives the real shop |
| Canada Post in phase 1 | Fake rates + Canadian address fields | No keys / no real charges yet |
| Canada Post after approval | Rating API (omit contract-id), then Non-Contract labels | Small Business path |
| Stack | Next.js + Tailwind + Vercel + Supabase | What you asked for |

---

## Stack (minimum)

```
GitHub (private repo)
  └── Next.js App Router + TypeScript + Tailwind
        ├── Vercel     → site + preview URLs
        ├── Supabase   → products + orders + shipments
        └── Canada Post (phase 2+) → rates, then labels
              keys live only on the server (Vercel env), never in the browser
```

- **Frontend:** Next.js 15, App Router, TypeScript, Tailwind v4. No UI kit.
- **Hosting:** Vercel, preview on every push.
- **DB:** Supabase. Catalog + orders from day 1.
- **Shipping:** Canada Post Developer Program APIs, authenticated with *her* Small Business customer number + API keys. Not Snap Ship.
- **Images:** public folder / remote placeholders.
- **No** extra deps in phase 1 (no Stripe, no maps, no auth UI, no CMS, no Canada Post SDK).

---

## Canada Post — what “connect her account” actually means

The page you sent is the **Solutions for Small Business** program. Two different tools:

| Thing | What it is | Can the website use it? |
|---|---|---|
| [Snap Ship](https://www.canadapost-postescanada.ca/cpc/en/small-business/snap-ship.page) | She logs into Canada Post, types an address, prints a label | **No.** Manual website. No embed, no OAuth. |
| [Developer Program APIs](https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/services/gettingstarted.jsf) | Rating + Non-Contract Shipping + Tracking | **Yes.** This is the real connection. |

Confirmed: Small Business only, no commercial contract. That means:

- **Get Rates** with her `customer-number`, **omit** `contract-id` → discounted Small Business rates
- **Non-Contract Shipping** to buy a label and get a PDF + tracking PIN
- Contract Shipping / manifests are out unless she upgrades

### What she must give us (phase 2, not now)

1. Join [Canada Post Developer Program](https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/services/gettingstarted.jsf) while signed into the **same** Small Business account.
2. From that dashboard: **customer number**, **development API username/password**, later **production** keys.
3. Shop origin: street, city, province, **postal code**. Mock uses Toronto `M5V 2T6` until she sends the real one.
4. Typical box: weight (g) + L×W×H (cm). Bakeries usually one default mailer.
5. API keys: she may only have a Snap Ship login. If so, she joins Developer Program on that same account when we start phase 2.

Without those, we cannot talk to her account. We can still mock the checkout so the client judges the flow.

### What we will not do

- Ask her for the Snap Ship website password and “log in as her”
- Put API keys in the browser or in git
- Create production labels in the mockup (that bills her)
- Build a Shopify-style shipping HQ (void, refunds, pickup booking, Admail)

---

## Phase 1 — mockup the client can tap (build this first)

No live Canada Post calls. The shipping *UI* is real; the rate is a stub.

### Pages

1. **`/` Home** — Sweetbites hero, “How do you want it?” (Pickup / Ship with Canada Post), flavor teaser, CTA to order. Language toggle.
2. **`/order` Menu** — sticky category chips, card list, cart bar.
3. **`/order/[slug]` Product** — photo, description, price, options, add to cart.
4. **`/cart` Cart** — lines, qty, fulfillment:
   - Pickup: name + phone
   - Ship: name, phone, Canadian address (street, city, province, postal code). Validate postal code format `A1A 1A1`. Show **mocked** Expedited / Regular / Xpresspost prices and ETA. Total = food + shipping.
5. **`/order-status/[id]` Confirmation** — “We got your order #…”. If ship: “Shipping quoted as Regular Parcel — $X (mock).”
6. **`/location`** — placeholder address + hours.

Routes in English; Spanish copy via the toggle (same URLs).

### Visual system (close to the references, not a pixel clone)

- Background: warm cream `#F6F0E6`
- Surface: off-white cards, 16–20px radius, light shadow
- Text: dark cocoa `#2B1E14`
- Accent: baked caramel `#C45C26` (buttons, price, active chip)
- Fonts: `Fraunces` (display / product names) + `Source Sans 3` (UI)
- Layout: max-width ~480px centered (phone-first). Desktop = same column.
- Cards: image 1:1 or 4:3, name, 2-line description, price right-aligned
- Chips: pill row, sticky under header, active = filled accent
- Cart: floating bottom bar, item count + total + “View cart”

### Data (Supabase)

```
categories (id, name_en, name_es, slug, sort)
products   (id, category_id, name_en, name_es, slug, description_en, description_es,
            price_cents, image_url, lead_days, ship_weight_g, ship_l_cm, ship_w_cm, ship_h_cm, active)
product_options (id, product_id, name_en, name_es, required, max_select)
option_values (id, option_id, name_en, name_es)
orders (id, status, fulfillment, lang,
        customer_name, phone,
        ship_street, ship_city, ship_province, ship_postal,
        notes, food_cents, shipping_cents, total_cents,
        created_at)
order_items (id, order_id, product_id, qty, unit_price_cents, options_json)
shipments (id, order_id, carrier, service_code, rate_cents,
           tracking_pin, label_url, raw_json, created_at)
  -- phase 1: one stub row, tracking_pin null
  -- phase 2+: filled by Canada Post
```

Seed: 4 categories, ~12 products, flavor options on boxes, one default parcel size. RLS: public read on catalog; public insert on orders; no public update/delete. Canada Post keys never in Supabase client.

Cart stays in `localStorage`. Submit writes `orders` + `order_items` + stub `shipments`.

### Out of scope for phase 1

Live Canada Post, payments, login, admin, inventory, maps, WhatsApp, email, invoices, multi-location.

---

## Phase 2 — after the client says “yes, this look”

1. Real name, logo, colors, photos, menu, origin address.
2. She joins Developer Program and sends keys (dev first).
3. Server-only Next.js route: **Get Rates** with her customer number, origin postal code, dest postal code, boxed weight. Checkout shows live Regular / Expedited / Xpresspost (+ GST/HST as CPC returns).
4. Payment (Stripe in CAD — decide then). Do not buy a CPC label before she is paid.
5. After paid (or after she marks “ready to ship” in a tiny admin): **Create Non-Contract Shipment** → PDF label + tracking PIN stored on `shipments`. She prints and drops at a post office / books Snap Ship pickup herself.
6. Confirmation page shows tracking PIN + Canada Post track link.
7. Admin: order list is enough in Supabase Studio at first. A “Buy label” button only if she refuses to use Snap Ship for printing.

Phase 2 is the actual account connection. Phase 1 only proves the UI.

---

## Phase 3 — only if she asks

- Book Canada Post pickup via API
- International / customs forms
- Multi-box orders
- Returns
- Custom admin instead of Supabase Studio

---

## Repo + deploy

1. Private GitHub repo: `sweetbites`.
2. This folder **is** the repo. No monorepo.
3. Vercel ↔ GitHub: production + preview.
4. Env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - later (server only): `CPC_CUSTOMER_NUMBER`, `CPC_API_USER`, `CPC_API_PASSWORD`, `CPC_ORIGIN_POSTAL=M5V2T6`, `CPC_ENV=dev|prod`
5. SQL seed in `supabase/seed.sql`.

---

## Implementation order (for Composer 2.5)

Do not start until this plan is approved.

1. `create-next-app` in this folder (TS, Tailwind, App Router, no extra extras).
2. Tokens + layout + EN/ES toggle + dummy header/footer.
3. Static pages with hardcoded products + **mocked** Canada Post rates (prove the look).
4. Private GitHub repo + first push.
5. Vercel project + preview URL for the client.
6. Supabase project + schema + seed.
7. Wire catalog + cart + order insert + stub shipment.
8. One self-check: submit a ship-to order, assert order + shipment rows exist.

Do **not** call Canada Post production in this pass.

---

## Locked

- Brand: **Sweetbites**
- Pickup **and** ship
- Canada Post Small Business (no contract-id)
- API keys later — she may only have Snap Ship today
- Mock origin: Toronto `M5V 2T6`

## Still optional (defaults are fine)

Not blocking. Say nothing and we use the default.

1. **Assets:** Sweetbites name is locked; logo/colors/menu still placeholder until she sends them
2. **Phase 1:** visual + mocked shipping **and** write orders to Supabase
3. **Repo:** private `sweetbites` on your personal GitHub
4. **Vercel + Supabase:** create them when we deploy (same GitHub login)

---

## What I will not do until you say go

- Write app code
- Create the GitHub repo
- Create Vercel / Supabase projects
- Call Canada Post (dev or prod)
