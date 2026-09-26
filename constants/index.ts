export const SEKELETON_TIMER: number = 300;
export const WEBSITE_NAME: string = "WalStore";

// Default until the admin Settings page overrides it.
export const FREE_SHIPPING_MIN_PRICE: number = 300;

// Header nav (desktop row, tablet row, mobile chips). `deal` renders orange.
export const NAV_LINKS: { key: string; href: string; deal?: boolean }[] = [
  { key: "Today's Deals", href: "/search?tag=todays-deal", deal: true },
  { key: "Best Sellers", href: "/search?tag=best-seller" },
  { key: "New Arrivals", href: "/search?tag=new-arrival" },
];

// Content pages served by /page/[slug].
export const PAGE_SLUGS = [
  "about-us",
  "careers",
  "blog",
  "sell",
  "affiliate",
  "advertise",
  "shipping",
  "returns",
  "conditions-of-use",
  "privacy-policy",
  "help",
] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

// Checkout defaults until the admin Settings page overrides them (USD).
export const SHIPPING_RATES = { standard: 9.99, express: 19.99 } as const;
export const TAX_RATE: number = 0;

// Products at or below this count show as "low stock" in the admin.
export const LOW_STOCK = 15;
