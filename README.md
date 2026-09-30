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
   subscribers, promo codes and the admin activity log. Don't run it against a database with real customers.
   - admins: `admin@example.com` / `123456`, `sara@walstore.com` / `123456`
   - customers: `john@me.com` / `Password123` (and every other `…@example.com` demo customer)
4. `npm run dev` → http://localhost:3000 (admin at `/en/admin`)

## Where things live

| Area | Path |
| --- | --- |
| Design tokens (colors, type, radius, motion) | `app/globals.css`, `tailwind.config.ts` |
| Color themes (Black · Red · Blue, each light + dark) | palettes in `app/globals.css` under `[data-brand]`; logic in `lib/brand.ts`, `hooks/use-brand.ts`; pickers in `components/shared/theme/*` |
| Home hero slider (Three.js) | `components/shared/home/hero-slider/*` — slides are built in `app/[locale]/(home)/page.tsx`; tuning in `config.ts`; colors come from the `--inverse*` and `--deal` tokens |
| UI kit | `components/ui/*` |
| Storefront pages | `app/[locale]/(home)`, `app/[locale]/(root)`, `app/[locale]/(auth)`, `app/[locale]/(checkout)` |
| Admin | `app/[locale]/admin/*`, `components/admin/*` |
| Server actions | `actions/*` |
| Route protection | `middleware.ts` (signed-in and admin-only paths), `lib/auth-guard.ts` |
| Translations | `messages/en.json`, `messages/ar.json` |
| Content pages (`/page/[slug]`) | `content/pages.ts` |

## UI kit

Buttons, inputs and cards all come from `components/ui/*`. Use their props instead of overriding heights, radii or borders with classes.

### Control sizes

Buttons, inputs and selects share one height scale, so they line up when placed side by side.

| Size | Height | Use |
| --- | --- | --- |
| `xs` | 28 | table row actions, tags |
| `sm` | 32 | secondary actions in dense rows |
| `md` | 36 | admin (pairs with `<Input size="sm">`) |
| `default` | 40 | storefront (pairs with `<Input>`) |
| `lg` | 44 | main CTA in a section |
| `xl` | 48 | hero, checkout |

Icon buttons: `icon-xs` · `icon-sm` · `icon-md` · `icon` (28 → 40, square).

### Button

```tsx
import { Button, buttonVariants } from "@/components/ui/button";

<Button>Add to cart</Button>
<Button variant="outline" size="md">Export</Button>
<Button variant="destructive-outline" loading={pending}>Delete</Button>
<Button size="icon" shape="pill" aria-label="Next"><ChevronRight /></Button>

// Links and other elements: same styles, no wrapper
<Link href="/checkout" className={buttonVariants({ size: "xl", block: true })}>Checkout</Link>
```

- **variant**: `default` · `secondary` · `outline` · `ghost` · `destructive` · `destructive-outline` · `deal` (money off only) · `inverse` (on dark surfaces) · `link`
- **shape**: `default` (10px radius) · `pill` (floating or round controls)
- **block**: full width · **loading**: shows a spinner and blocks clicks · **asChild**: renders the child element

### Card

`size` sets the padding once (`--card-p`) and every part reads it.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, cardVariants } from "@/components/ui/card";

<Card size="lg">
  <CardHeader>
    <CardTitle>Shipping</CardTitle>
    <CardDescription>Rates shown at checkout</CardDescription>
    <CardAction><Button size="sm" variant="outline">Edit</Button></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter><Button>Save</Button></CardFooter>
</Card>

// Tables and lists that reach the edges
<section className={cardVariants({ flush: true, className: "overflow-hidden" })}>
  <Table>…</Table>
</section>
```

- **variant**: `default` · `elevated` · `interactive` (lifts on hover, for clickable cards) · `muted` · `ghost`
- **size** (padding): `sm` 16 · `md` 20 · `lg` 20 → 24 · `xl` 24 → 40 (mobile → desktop)
- **flush**: no padding on the card; `CardHeader`, `CardContent` and `CardFooter` pad themselves instead. `CardSection` bleeds to the edges inside a padded card.
- `<Card>` stacks its children (`flex-col gap-4`). `cardVariants()` adds only the surface and keeps the element's own layout, so use it on a `section`, `li` or `Link` that already has one.

## Before going live

- **Fill in the placeholders** in `content/pages.ts` (legal text, return policy, delivery times) — they render as grey italic `[brackets]` until replaced.
- **Admin → Settings**: set the support email/phone, free-shipping threshold, shipping rates and tax rate (defaults: $300 free shipping, $9.99 standard, $19.99 express, 0% tax).
- **Payments**: only cash on delivery works. Card and PayPal are shown as "not available yet" until a payment gateway is added.
- **Promo codes**: managed in Admin → Promo codes. The seed adds demo codes (`WELCOME10`, `SAVE20`, …); delete or deactivate them before launch. A code takes money off the items only (never shipping); free shipping is judged on the subtotal before the discount, and tax on the subtotal after it.
- Not built (no backend yet): Google sign-in, password reset emails, email verification, email notifications.
- Product photos uploaded from the admin are stored in MongoDB and served from `/api/images/[id]`.
