# WalStore

Next.js 15 storefront and admin (English + Arabic, light + dark) with MongoDB, next-auth v5 and next-intl.

## Setup

Requires Node.js 22 (see `.nvmrc`).

1. `npm install`
2. Create `.env` with:
   - `DB_URL` — MongoDB connection string
   - `AUTH_SECRET` — random string for sessions
   - `NEXT_PUBLIC_SECRET_KEY_CUREENCY` — exchangerate-api.com key (currency conversion)
3. `npm run seed` — **wipes the database** and fills it with a full demo store: 24 products, 14 users,
   ~6 months of orders (`WS-10001`…), reviews (6 waiting for moderation), store settings, newsletter
   subscribers and the admin activity log. Don't run it against a database with real customers.
   - admins: `admin@example.com` / `123456`, `sara@walstore.com` / `123456`
   - customers: `john@me.com` / `Password123` (and every other `…@example.com` demo customer)
4. `npm run dev` → http://localhost:3000 (admin at `/en/admin`)

## Where things live

| Area | Path |
| --- | --- |
| Design tokens (colors, type, radius, motion) | `app/globals.css`, `tailwind.config.ts` |
| Color themes (Black · Red · Blue, each light + dark) | palettes in `app/globals.css` under `[data-brand]`; logic in `lib/brand.ts`, `hooks/use-brand.ts`; pickers in `components/shared/theme/*` |
| Home 3D hero (Three.js) | `components/shared/home/hero-3d/*` (colors come from the `--inverse*` tokens) |
| UI kit | `components/ui/*` |
| Storefront pages | `app/[locale]/(home)`, `app/[locale]/(root)`, `app/[locale]/(auth)`, `app/[locale]/(checkout)` |
| Admin | `app/[locale]/admin/*`, `components/admin/*` |
| Server actions | `actions/*` |
| Route protection | `middleware.ts` (signed-in and admin-only paths), `lib/auth-guard.ts` |
| Translations | `messages/en.json`, `messages/ar.json` |
| Content pages (`/page/[slug]`) | `content/pages.ts` |

## Before going live

- **Fill in the placeholders** in `content/pages.ts` (legal text, return policy, delivery times) — they render as grey italic `[brackets]` until replaced.
- **Admin → Settings**: set the support email/phone, free-shipping threshold, shipping rates and tax rate (defaults: $300 free shipping, $9.99 standard, $19.99 express, 0% tax).
- **Payments**: only cash on delivery works. Card and PayPal are shown as "not available yet" until a payment gateway is added.
- Not built (no backend yet): Google sign-in, password reset emails, email verification, email notifications, promo codes.
- Product photos uploaded from the admin are stored in MongoDB and served from `/api/images/[id]`.
