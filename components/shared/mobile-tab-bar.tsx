"use client";

import { CircleUserRound, House, LayoutGrid, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { CartCount, useCartCount } from "./header/cart-button";

// Phones only: Home · Categories · Cart · Account.
export default function MobileTabBar() {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const count = useCartCount();
  // Product pages and a filled cart show their own sticky action bar instead.
  const hidden = pathname.startsWith("/product/") || (pathname === "/cart" && count > 0);

  const tabs = [
    { href: "/", label: t("Home"), icon: House, match: (p: string) => p === "/" },
    { href: "/search", label: t("Categories"), icon: LayoutGrid, match: (p: string) => p.startsWith("/search") },
    { href: "/cart", label: t("Cart"), icon: ShoppingBag, match: (p: string) => p.startsWith("/cart"), badge: count },
    { href: "/account", label: t("Account"), icon: CircleUserRound, match: (p: string) => p.startsWith("/account") },
  ];

  if (hidden) return null;

  return (
    <nav
      aria-label={t("Tabs")}
      className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-4 border-t border-border bg-card/95 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon, match, badge }) => {
        const current = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] transition-colors duration-fast",
              current ? "font-bold text-foreground" : "font-semibold text-foreground-secondary"
            )}
          >
            <span className="relative flex">
              <Icon className="size-[22px]" strokeWidth={current ? 2 : 1.8} aria-hidden />
              {!!badge && <CartCount count={badge} />}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
