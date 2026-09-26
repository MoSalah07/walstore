import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import Container from "@/components/shared/container";
import Logo from "@/components/shared/logo";
import Price from "@/components/shared/price";
import { WEBSITE_NAME } from "@/constants";
import { getStoreSettings } from "@/lib/settings";
import { Link } from "@/i18n/routing";
import LocaleCurrencyMenu from "../header/locale-currency-menu";
import ScrollTop from "./ScrollTop";

export default async function Footer() {
  const [t, settings] = await Promise.all([getTranslations("Footer"), getStoreSettings()]);

  const columns = [
    {
      title: t("Get to Know Us"),
      links: [
        { label: t("Careers"), href: "/page/careers" },
        { label: t("Blog"), href: "/page/blog" },
        { label: t("About name", { name: WEBSITE_NAME }), href: "/page/about-us" },
      ],
    },
    {
      title: t("Make Money with Us"),
      links: [
        { label: t("Sell products on", { name: WEBSITE_NAME }), href: "/page/sell" },
        { label: t("Become an Affiliate"), href: "/page/affiliate" },
        { label: t("Advertise Your Products"), href: "/page/advertise" },
      ],
    },
    {
      title: t("Let Us Help You"),
      links: [
        { label: t("Shipping Rates & Policies"), href: "/page/shipping" },
        { label: t("Returns & Replacements"), href: "/page/returns" },
        { label: t("Your orders"), href: "/account/orders" },
        { label: t("Help"), href: "/page/help" },
      ],
    },
  ];

  return (
    <footer className="bg-inverse text-sm text-inverse-muted">
      <ScrollTop />
      <Container className="grid grid-cols-1 gap-10 pb-8 pt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="flex flex-col gap-4">
          <Logo tone="inverse" />
          <p className="max-w-[260px] leading-relaxed">
            {t.rich("Tagline", {
              price: () => <Price amount={settings.pricing.freeShippingMin} whole />,
            })}
          </p>
          <div className="flex gap-2">
            <Suspense>
              <LocaleCurrencyMenu variant="pill" only="language" />
              <LocaleCurrencyMenu variant="pill" only="currency" />
            </Suspense>
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
            <h2 className="mb-1 text-[15px] font-bold text-inverse-foreground">{col.title}</h2>
            {col.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="w-fit transition-colors duration-fast hover:text-inverse-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </Container>
      <Container>
        <div className="flex flex-col gap-3 border-t border-inverse-border py-5 text-[13px] sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <span>{t("Rights", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/page/conditions-of-use" className="hover:text-inverse-foreground">
              {t("Conditions of Use")}
            </Link>
            <Link href="/page/privacy-policy" className="hover:text-inverse-foreground">
              {t("Privacy Notice")}
            </Link>
            <Link href="/page/help" className="hover:text-inverse-foreground">
              {t("Help")}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
