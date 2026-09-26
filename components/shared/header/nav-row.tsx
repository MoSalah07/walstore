import { Menu } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { NAV_LINKS } from "@/constants";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// 44px desktop row / 48px tablet row under the search bar.
export default async function NavRow({ categories }: { categories: string[] }) {
  const t = await getTranslations("Header");
  const tc = await getTranslations("Categories");
  const link =
    "shrink-0 whitespace-nowrap transition-colors duration-fast hover:text-foreground-secondary";

  return (
    <nav
      aria-label={t("Main")}
      className="flex h-12 items-center justify-between gap-6 border-t border-border text-sm lg:h-11"
    >
      <div className="flex min-w-0 items-center gap-[22px] overflow-x-auto scrollbar-none lg:gap-7">
        <Link href="/search" className={cn(link, "hidden items-center gap-2 font-bold lg:flex")}>
          <Menu className="size-[18px]" aria-hidden />
          {t("All departments")}
        </Link>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={cn(link, l.deal ? "font-bold text-deal hover:text-deal/80" : "text-foreground")}
          >
            {t(l.key)}
          </Link>
        ))}
        {categories.map((c) => (
          <Link
            key={c}
            href={`/search?category=${encodeURIComponent(c)}`}
            className={cn(link, "text-foreground")}
          >
            {tc.has(c) ? tc(c) : c}
          </Link>
        ))}
      </div>
      <div className="hidden shrink-0 items-center gap-6 text-foreground-secondary lg:flex">
        <Link href="/page/about-us" className={link}>
          {t("About")}
        </Link>
        <Link href="/account/orders" className={link}>
          {t("Your orders")}
        </Link>
      </div>
    </nav>
  );
}
