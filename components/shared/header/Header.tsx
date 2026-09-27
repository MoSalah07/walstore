import { Suspense } from "react";
import { Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getAllCategories } from "@/actions/product.action";
import { auth } from "@/auth";
import Container from "@/components/shared/container";
import Logo from "@/components/shared/logo";
import Price from "@/components/shared/price";
import { getStoreSettings } from "@/lib/settings";
import { Link } from "@/i18n/routing";
import CartButton from "./cart-button";
import LocaleCurrencyMenu from "./locale-currency-menu";
import MobileMenu from "./mobile-menu";
import NavRow from "./nav-row";
import SearchBar from "./search-bar";
import AppearanceMenu from "./appearance-menu";
import UserButton from "./user-button";

async function safeCategories() {
  try {
    return (await getAllCategories()) as string[];
  } catch {
    return [];
  }
}

// Desktop (≥1024): 36px top bar + 80px main row + 44px nav = 160px.
// Tablet: 72px row + 48px nav. Phone: menu/logo/icons, search, quick chips.
export default async function Header() {
  const [t, tc, categories, session, settings] = await Promise.all([
    getTranslations("Header"),
    getTranslations("Categories"),
    safeCategories(),
    auth(),
    getStoreSettings(),
  ]);

  return (
    <>
      <div className="hidden h-9 bg-inverse text-[13px] text-inverse-muted lg:block">
        <Container className="flex h-full items-center justify-between">
          <p className="flex items-center gap-2">
            <Truck className="size-4" aria-hidden />
            {t.rich("Free shipping over", {
              price: () => <Price amount={settings.pricing.freeShippingMin} whole />,
            })}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/page/help" className="hover:text-inverse-foreground">
              {t("Customer Service")}
            </Link>
            <Link href="/page/help" className="hover:text-inverse-foreground">
              {t("Help")}
            </Link>
            <Suspense>
              <LocaleCurrencyMenu />
            </Suspense>
          </div>
        </Container>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <Container>
          {/* Desktop */}
          <div className="hidden h-20 items-center gap-8 lg:flex">
            <Logo />
            <Suspense>
              <SearchBar categories={categories} className="flex-1" />
            </Suspense>
            <div className="flex items-center gap-2">
              <AppearanceMenu />
              <UserButton />
              <CartButton />
            </div>
          </div>

          {/* Tablet */}
          <div className="hidden h-[72px] items-center gap-4 md:flex lg:hidden">
            <Suspense>
              <MobileMenu categories={categories} userName={session?.user?.name} />
            </Suspense>
            <Logo size="sm" />
            <Suspense>
              <SearchBar compact className="flex-1" />
            </Suspense>
            <div className="-me-2.5 flex items-center">
              <UserButton compact />
              <CartButton showLabel={false} />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2.5 pb-3 pt-2.5 md:hidden">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-1">
                <Suspense>
                  <MobileMenu categories={categories} userName={session?.user?.name} />
                </Suspense>
                <Logo size="sm" />
              </div>
              <div className="-me-2.5 flex items-center">
                <UserButton compact />
                <CartButton showLabel={false} />
              </div>
            </div>
            <Suspense>
              <SearchBar compact />
            </Suspense>
            <nav aria-label={t("Quick links")} className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
              <Link
                href="/search?tag=todays-deal"
                className="flex h-9 shrink-0 items-center rounded-full bg-deal-subtle px-3.5 text-sm font-bold text-deal"
              >
                {t("Today's Deals")}
              </Link>
              {[
                { href: "/search?tag=best-seller", label: t("Best Sellers") },
                { href: "/search?tag=new-arrival", label: t("New Arrivals") },
                ...categories.map((c) => ({
                  href: `/search?category=${encodeURIComponent(c)}`,
                  label: tc.has(c) ? tc(c) : c,
                })),
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex h-9 shrink-0 items-center rounded-full bg-background px-3.5 text-sm font-semibold text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:block">
            <NavRow categories={categories} />
          </div>
        </Container>
      </header>
    </>
  );
}
