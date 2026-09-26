import Image from "next/image";
import { ArrowRight, Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  getBestSellers,
  getCategorySummaries,
  getProductByTag,
  getPublishedCount,
} from "@/actions/product.action";
import { BrowsingHistoryTiles } from "@/components/shared/browsing-history-list";
import Container from "@/components/shared/container";
import Hero3D from "@/components/shared/home/hero-3d";
import NewsletterForm from "@/components/shared/home/newsletter-form";
import ProductRail from "@/components/shared/home/product-rail";
import SectionHeading from "@/components/shared/home/section-heading";
import Price from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { FREE_SHIPPING_MIN_PRICE } from "@/constants";
import { getDirection } from "@/i18n/i18n-confige";
import { Link } from "@/i18n/routing";
import { ProductTags } from "@/interfaces/product.interface";
import { discountPercent } from "@/lib/format";

const arrow = "size-4 rtl:rotate-180";

export default async function Home() {
  const [t, tc, locale] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Categories"),
    getLocale(),
  ]);
  const dir = getDirection(locale);

  const [deals, bestSellers, newArrivals, featured, categories, total] = await Promise.all([
    getProductByTag({ tag: ProductTags["todays-deal"], limit: 8 }),
    getBestSellers(8),
    getProductByTag({ tag: ProductTags["new-arrival"], limit: 4 }),
    getProductByTag({ tag: ProductTags["featured"], limit: 4 }),
    getCategorySummaries(),
    getPublishedCount(),
  ]);

  const heroPhotos = Array.from(
    new Set([...deals, ...bestSellers, ...newArrivals].map((p) => p.images[0]))
  ).slice(0, 8);
  const bestDeal = Math.max(0, ...deals.map((p) => discountPercent(p.price, p.listPrice)));
  const dealTile = deals[0];
  const jeans = bestSellers.find((p) => p.category === "Jeans") ?? bestSellers[0];
  const catLabel = (c: string) => (tc.has(c) ? tc(c) : c);

  const collections = [
    { title: t("Explore New Arrivals"), items: newArrivals, href: "/search?tag=new-arrival" },
    { title: t("Discover Best Sellers"), items: bestSellers.slice(0, 4), href: "/search?tag=best-seller" },
    { title: t("Featured Products"), items: featured, href: "/search?tag=featured" },
  ].filter((c) => c.items.length > 0);

  const perks = [
    { icon: Truck, title: t("Free shipping"), sub: t.rich("On orders over", { price: () => <Price amount={FREE_SHIPPING_MIN_PRICE} /> }) },
    { icon: RotateCcw, title: t("Easy returns"), sub: t("Returns & replacements") },
    { icon: ShieldCheck, title: t("Secure checkout"), sub: t("Protected payments") },
    { icon: Headset, title: t("Customer service"), sub: t("Here to help") },
  ];

  const heroCopy = (
    <>
      <span className="flex h-8 items-center gap-2 self-start rounded-full bg-white/[0.08] pe-3.5 ps-2.5 text-[13px] font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">
        <span className="size-2 rounded-full bg-white shadow-[0_0_0_4px_rgb(255_255_255/0.18)]" />
        {t("New season", { year: new Date().getFullYear() })}
      </span>
      <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[56px] lg:text-[66px] lg:leading-[0.98] lg:tracking-[-0.045em]">
        {t.rich("Hero title", { br: () => <br className="hidden md:block" /> })}
      </h1>
      <p className="hidden max-w-[440px] text-[17px] leading-relaxed text-[#C4CAD4] md:block">
        {t("Hero body")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-3">
        <Link
          href="/search?tag=new-arrival"
          className="flex h-[46px] items-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold text-[#0B0D12] transition-colors duration-fast hover:bg-white/90 md:h-[52px] md:px-6"
        >
          {t("Shop new arrivals")}
          <ArrowRight className={arrow} aria-hidden />
        </Link>
        <Link
          href="/search?tag=todays-deal"
          className="hidden h-[52px] items-center rounded-full bg-white/[0.06] px-6 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] transition-colors duration-fast hover:bg-white/[0.12] md:flex"
        >
          {t("Today's deals link")}
        </Link>
      </div>
    </>
  );

  return (
    <Container className="flex flex-col gap-12 pb-16 pt-5 md:gap-[72px] md:pb-20 md:pt-8">
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Hero: 3D ring on tablet/desktop, photo card on phones. */}
        <section aria-label={t("Hero label")} className="overflow-hidden rounded-2xl bg-[#0B0D12] text-white md:hidden">
          <div className="relative h-[180px]">
            <Image src="/images/banner1.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="flex flex-col gap-3 p-[22px]">{heroCopy}</div>
        </section>
        <section
          aria-label={t("Hero label")}
          className="relative hidden h-[480px] overflow-hidden rounded-3xl bg-[#0B0D12] text-white md:block lg:h-[540px]"
        >
          <Hero3D
            photos={heroPhotos}
            dir={dir}
            fallback={
              <Image
                src="/images/banner1.jpg"
                alt=""
                fill
                sizes="50vw"
                className="!start-auto !w-1/2 object-cover opacity-80"
              />
            }
          />
          <div className="pointer-events-none relative z-[1] flex h-full w-full max-w-[560px] flex-col gap-[22px] px-10 pb-12 pt-14 lg:ps-16 lg:pt-16 [&_a]:pointer-events-auto">
            {heroCopy}
            <dl className="mt-auto flex gap-7 text-[13px] text-[#A4ACB9]">
              {[
                { v: String(total), l: t("products") },
                { v: String(categories.length), l: t("categories") },
                { v: <Price amount={FREE_SHIPPING_MIN_PRICE} whole className="!font-display" />, l: t("ships free") },
              ].map((s, i) => (
                <div key={i} className="flex flex-col-reverse gap-0.5">
                  <dt>{s.l}</dt>
                  <dd className="font-display text-[22px] font-extrabold text-white tabular-nums">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Promo tiles */}
        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          {dealTile && (
            <Link
              href="/search?tag=todays-deal"
              className="group flex h-[150px] items-center justify-between gap-4 rounded-2xl bg-deal-subtle px-6 text-foreground md:h-[180px] md:px-8"
            >
              <div className="flex flex-col gap-2">
                <span className="type-overline text-[13px] tracking-[0.06em] text-deal">{t("Today's Deals")}</span>
                <span className="font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
                  {t("Up to off", { percent: bestDeal })}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {t("Shop deals")} <ArrowRight className={arrow} aria-hidden />
                </span>
              </div>
              <span className="relative size-[110px] shrink-0 transition-transform duration-slow ease-standard group-hover:scale-105 md:size-[140px]">
                <Image src={dealTile.images[0]} alt="" fill sizes="140px" className="object-contain mix-blend-multiply" />
              </span>
            </Link>
          )}
          {jeans && (
            <Link
              href="/search?category=Jeans"
              className="group flex h-[150px] items-center justify-between gap-4 rounded-2xl bg-secondary px-6 text-foreground md:h-[180px] md:px-8"
            >
              <div className="flex flex-col gap-2">
                <span className="type-overline text-[13px] tracking-[0.06em] text-foreground-secondary">{t("Best Sellers")}</span>
                <span className="font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
                  {t("Denim that lasts")}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {t("Shop jeans")} <ArrowRight className={arrow} aria-hidden />
                </span>
              </div>
              <span className="relative size-[110px] shrink-0 transition-transform duration-slow ease-standard group-hover:scale-105 md:size-[140px]">
                <Image src={jeans.images[0]} alt="" fill sizes="140px" className="object-contain mix-blend-multiply dark:mix-blend-normal" />
              </span>
            </Link>
          )}
        </div>

        {/* Trust strip */}
        <ul className="grid grid-cols-2 gap-2 md:gap-0 md:rounded-lg md:border md:border-border md:bg-card lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, sub }, i) => (
            <li
              key={title}
              className={`flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 md:gap-3.5 md:rounded-none md:border-0 md:px-6 md:py-5 ${i < 3 ? "lg:border-e lg:border-border" : ""} ${i > 1 ? "hidden md:flex" : ""}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary md:size-11">
                <Icon className="size-4 md:size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-semibold md:text-[15px] md:font-bold">{title}</span>
                <span className="hidden text-[13px] text-foreground-secondary md:block">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="flex flex-col gap-4 md:gap-6">
          <SectionHeading title={t("Categories to explore")} action={{ label: t("See More"), href: "/search" }} />
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/search?category=${encodeURIComponent(c.name)}`}
                className="group relative block h-[180px] overflow-hidden rounded-[18px] bg-border md:h-[320px] md:rounded-xl"
              >
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.04]"
                />
                <span className="absolute bottom-2.5 start-2.5 flex h-[34px] items-center rounded-full bg-card px-3 text-sm font-bold text-foreground md:inset-x-3.5 md:bottom-3.5 md:h-[60px] md:justify-between md:rounded-[14px] md:pe-2.5 md:ps-[18px]">
                  <span className="flex flex-col">
                    <span className="md:text-base">{catLabel(c.name)}</span>
                    <span className="hidden text-[13px] font-normal text-foreground-secondary md:block">
                      {t("products count", { count: c.count })}
                    </span>
                  </span>
                  <span className="hidden size-10 items-center justify-center rounded-full bg-primary text-primary-foreground md:flex">
                    <ArrowRight className={arrow} aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRail
        title={t("Today's Deals")}
        badge={<Badge variant="deal-subtle" className="hidden text-[13px] md:inline-flex">{t("Limited time deal")}</Badge>}
        products={deals.slice(0, 4)}
        action={{ label: t("View All"), href: "/search?tag=todays-deal" }}
      />

      {/* Picked for you */}
      {collections.length > 0 && (
        <section className="flex flex-col gap-4 md:gap-6">
          <SectionHeading title={t("Picked for you")} />
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {collections.map((col) => (
              <div key={col.title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:p-6">
                <h3 className="text-xl font-bold">{col.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {col.items.slice(0, 4).map((p) => (
                    <Link
                      key={p._id.toString()}
                      href={`/product/${p.slug}`}
                      aria-label={p.name}
                      className="group relative flex h-[130px] items-center justify-center rounded-md bg-sunken dark:bg-[#E9ECF1] md:h-[150px]"
                    >
                      <span className="relative size-[80%]">
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-contain mix-blend-multiply transition-transform duration-slow ease-standard group-hover:scale-105"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
                <Link href={col.href} className="mt-auto flex items-center gap-1.5 text-[15px] font-semibold">
                  {t("See More")} <ArrowRight className={arrow} aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductRail
        title={t("Best Selling Products")}
        products={bestSellers}
        carousel
        action={{ label: t("View All"), href: "/search?sort=best-selling" }}
      />

      <BrowsingHistoryTiles />

      {/* Newsletter */}
      <section className="flex flex-col gap-6 rounded-2xl bg-[#0B0D12] px-6 py-8 text-white md:px-14 md:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="flex max-w-[520px] flex-col gap-2.5">
          <h2 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[38px]">
            {t("Newsletter title")}
          </h2>
          <p className="text-base text-[#D0D5DD]">{t("Newsletter body")}</p>
        </div>
        <NewsletterForm />
      </section>
    </Container>
  );
}
