# Sweetbites — client feature map (Sep 2026)

Go by parts.

## Phase A2 — header stamp + home sliders (this pass)

Client said yes to Phase A. Mods:

1. **Same cookie stamp.** Header badge beside SWEETBITES, **almost as tall as the header bar** (today it is 36px — too small). Watermark stays.
2. **Desktop website**, not a 480px phone strip. Content `max-width` ~1120–1280px so it fills a PC monitor. Stack on small screens.
3. **Home only:** two Crumbl-style banner **rows**:
   - Row 1: **weekly promotions** — 5 placeholder slides
   - Row 2: **client reviews** — 5 placeholder slides
   - Each row: auto-rotate **and** swipe/arrows/dots. Pause on hover. `prefers-reduced-motion` = no autoplay.
   - No new npm deps. One client carousel component reused twice.
   - Placeholder Unsplash + fake quotes/promos. EN/ES.
4. Palette unchanged. Do not touch admin, gift cards, GA, Canada Post live.

## Phase A3 — full-bleed banners + header wordmark (this pass)

From the screenshot: banners are boxed inside the 1200px column; hamburger is inset; SWEETBITES text is still the wordmark.

1. **Banners full viewport width** on home. Break out of `max-w-6xl` / `px-4`. Edge to edge of the PC screen (Crumbl-style). Drop large side rounded-gap; two rows still. Other pages keep a content column.
2. **Hamburger flush left** of the header bar (against the window edge, small padding only). Header is full width — do not center the header row in `max-w-6xl`.
3. **Header logo:** remove the Lilita “SWEETBITES” text. Remove the small circular badge from the header. Use `logos/4.png` (wordmark “Sweet Bites”) **bigger** — ~64–80px tall. Copy to `public/logos/wordmark.png`. That PNG is dark type on a **black** box: hide the black (e.g. `mix-blend-mode: screen`) so it sits on the blush bar, not a black rectangle. `alt="Sweetbites"`.
4. Watermark, palette, cart, drawer panel: unchanged.

## Phase Auth — customer accounts (this pass)

One account for everyone. Wholesale = role, not a second login. Guest checkout stays. After login → **home**.

**Sign-in:** email + password, Google, Facebook (Supabase Auth). User will verify with their Google account.

**Account page `/account` tabs:**
1. Orders — history (attach `user_id` on order if logged in; guests still checkout)
2. Wholesale — status + link to `/wholesale` form
3. Information — name, phone, default address
4. Payment methods — placeholder until Stripe
5. Addresses — saved shipping/delivery (placeholder list + add)
6. Security — password (email users) + which OAuth is linked
7. Notifications — newsletter on/off

Not in this pass: gift cards, admin, rewards.

Composer 2.5 executes Auth. Grok reviews after.

---

---

---

Locked from before: Next.js + Vercel + Supabase, EN/ES, pickup + Canada Post ship, Instagram [sweetbites.rd](https://www.instagram.com/sweetbites.rd/). Palette below **replaces** the Menüpp pink/yellow.

**Note:** IG is `.rd` (Dominican Republic) while the mock still says Toronto / Canada Post. Confirm market with her before shipping live.

---

## Palette (client)

| Token | Hex | Use |
|---|---|---|
| Blush | `#e7aca7` | Header bar, chips idle, soft fills |
| Mint | `#97d3ba` | Accents, success, promo tags |
| Berry | `#aa1d50` | Buttons, prices, wordmark, links |
| Cream | `#f4f0ec` | Page background |
| Coal | `#323335` | Body text |

Logo watermark: `logos/Logo badge.png` (circular cookie stamp). Fallback: `logos/Sb Secondary Logo Coal Rgb 900px W 72ppi.png`. Copy into `public/logos/`. Faint, centered, `pointer-events: none`. If the PNG has a black box, use `mix-blend-mode: multiply` or the SVG `logos/brand mark.svg`.

---

## Already built (don’t redo)

- Online ordering (menu + cart + order API)
- Local pickup at checkout
- Shipping (mocked Canada Post)
- Instagram / WhatsApp icons
- Contact popup + location

---

## Easy → hard

### A — Easy (this pass). UI only. No new deps. No auth.

1. Swap every `#e84086` / `#fdf198` / `#1d1d1d` to the palette above (CSS tokens first, then leftover hex).
2. Watermark badge behind the page.
3. Header: small badge mark + SWEETBITES (berry). Drawer: Wholesale link.
4. Third fulfillment: **Local delivery** (address in city, mock $6.00). Pickup + ship stay.
5. **Home:** hero (problem: small-batch treats, pickup / local / ship), top 3 sellers from catalog, 3 brand-value lines, promo strip, social icons.
6. **Wholesale** `/wholesale` — tab in drawer. Short inquiry form (business, city, email, phone, message). POST like orders: Supabase if env set, else `.local-inquiries.json`.
7. **Contact form** `/contact` — name, email, message. Same submit path. Keep existing contact popup.
8. **About** `/about` — first-person placeholder + photo slot.
9. **FAQ** `/faq` — shipping, pickup, returns (placeholder).
10. **Events** `/events` — 2 fake markets.
11. **Find us** `/stores` — 2 fake retailers.
12. **Subscribe** block on home + footer (email only, same inquiry store with `type: newsletter`).
13. **Product page:** ingredients, benefits, 1 extra image slot, 2 fake reviews. Name/price/photo already exist.

### B — Medium (later)

- Promo code field at checkout (one table of codes)
- Wire forms to real Supabase tables
- `NEXT_PUBLIC_GA_ID` + `NEXT_PUBLIC_META_PIXEL` snippets (off until she sends IDs)
- Admin-lite: password-gated `/admin` to edit price/qty/promo on products (still not full CMS)

### C — Hard (after she pays / sends keys)

- Real admin (Supabase Auth) — prices, stock, promos
- Customer accounts
- Gift cards
- Stripe / Interac
- Live Canada Post rates + labels
- Delivery zones
- Real analytics IDs

**Out until she asks again:** gift cards, accounts, Google/Meta pixels with fake IDs, full admin.

---

## Composer 2.5 — phase A checklist

- Tokens in `globals.css`; header cream/blush; buttons berry; mint for promo.
- `public/logos/badge.png` watermark on `body` (low opacity, coal).
- Drawer + routes for `/wholesale` `/contact` `/about` `/faq` `/events` `/stores`.
- `Fulfillment = "pickup" | "delivery" | "ship"` — update types, picker, cart.
- Forms: one `app/api/inquiries/route.ts`, one `lib/inquiries.ts`.
- EN/ES on new copy. No new npm packages.
- Keep 480px column. `prefers-reduced-motion`.
- Verify: home, wholesale submit, contact submit, product reviews, delivery at cart, watermark visible, palette applied.
