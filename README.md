# WalStore

Next.js 15 storefront and admin (English + Arabic, light + dark) with MongoDB, next-auth v5 and next-intl.

## Setup

1. `npm install`
2. Create `.env` with:
   - `DB_URL` — MongoDB connection string
   - `AUTH_SECRET` — random string for sessions
   - `NEXT_PUBLIC_SECRET_KEY_CUREENCY` — exchangerate-api.com key (currency conversion)
3. `npm run seed` — reloads the demo products and adds demo accounts **only if they don't exist**:
   - admin: `admin@example.com` / `123456`
   - customer: `john@me.com` / `Password123`
4. `npm run dev` → http://localhost:3000 (admin at `/en/admin`)

## Where things live

| Area | Path |
| --- | --- |
| Design tokens (colors, type, radius, motion) | `app/globals.css`, `tailwind.config.ts` |
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
