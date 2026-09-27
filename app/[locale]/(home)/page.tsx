import Image from "next/image";
import { ArrowRight, Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  getBestSellers,
  getCategorySummaries,
  getProductByTag,
} from "@/actions/product.action";
import { BrowsingHistoryTiles } from "@/components/shared/browsing-history-list";
import Container from "@/components/shared/container";
import HeroSlider, { type HeroSlide } from "@/components/shared/home/hero-slider";
import NewsletterForm from "@/components/shared/home/newsletter-form";
import ProductRail from "@/components/shared/home/product-rail";
import SectionHeading from "@/components/shared/home/section-heading";
import Price from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { cardVariants } from "@/components/ui/card";
import { getPricingConfig } from "@/lib/settings";
import { getDirection } from "@/i18n/i18n-confige";
import { Link } from "@/i18n/routing";
import { ProductTags } from "@/interfaces/product.interface";
import { discountPercent } from "@/lib/format";
import { cn, isLookPhoto } from "@/lib/utils";

const arrow = "size-4 rtl:rotate-180";

export default async function Home() {
  const [t, tc, locale] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Categories"),
    getLocale(),
  ]);
  const dir = getDirection(locale);

  const [deals, bestSellers, newArrivals, featured, categories, pricing] = await Promise.all([
    getProductByTag({ tag: ProductTags["todays-deal"], limit: 8 }),
    getBestSellers(8),
    getProductByTag({ tag: ProductTags["new-arrival"], limit: 4 }),
    getProductByTag({ tag: ProductTags["featured"], limit: 4 }),
    getCategorySummaries(),
    getPricingConfig(),
  ]);
  const freeMin = pricing.freeShippingMin;

  const bestDeal = Math.max(0, ...deals.map((p) => discountPercent(p.price, p.listPrice)));
  const dealTile = deals[0];
  const jeans = bestSellers.find((p) => p.category === "Pants" && /jeans/i.test(p.name)) ?? bestSellers[0];
  // On-model photos fill their frame; studio shots on white sit contained on the tint.
  const fit = (src: string) => (isLookPhoto(src) ? "rounded-md object-cover" : "object-contain mix-blend-multiply");
  const catLabel = (c: string) => (tc.has(c) ? tc(c) : c);

  const collections = [
    { title: t("Explore New Arrivals"), items: newArrivals, href: "/search?tag=new-arrival" },
    { title: t("Discover Best Sellers"), items: bestSellers.slice(0, 4), href: "/search?tag=best-seller" },
    { title: t("Featured Products"), items: featured, href: "/search?tag=featured" },
  ].filter((c) => c.items.length > 0);

  const perks = [
    { icon: Truck, title: t("Free shipping"), sub: t.rich("On orders over", { price: () => <Price amount={freeMin} whole /> }) },
    { icon: RotateCcw, title: t("Easy returns"), sub: t("Returns & replacements") },
    { icon: ShieldCheck, title: t("Secure checkout"), sub: t("Protected payments") },
    { icon: Headset, title: t("Customer service"), sub: t("Here to help") },
  ];

  // Editorial slides; category slides only appear while that category has products.
  const cover = (name: string) => categories.find((c) => c.name === name)?.image;
  const categorySlide = (id: string, name: string, key: string): HeroSlide | null => {
    const image = cover(name);
    return image
      ? {
          id,
          label: t(`Slide ${key}`),
          eyebrow: `${catLabel(name)} · ${t("products count", { count: categories.find((c) => c.name === name)!.count })}`,
          title: t(`${key} title`),
          body: t(`${key} body`),
          cta: { href: `/search?category=${encodeURIComponent(name)}`, label: t(`Shop ${key}`) },
          image,
          tone: "accent",
        }
      : null;
  };
  const heroSlides = [
    {
      id: "new",
      label: t("Slide new"),
      eyebrow: t("New season", { year: new Date().getFullYear() }),
      title: t.rich("Hero title", { br: () => <br className="hidden md:block" /> }),
      body: t("Hero body"),
      cta: { href: "/search?tag=new-arrival", label: t("Shop new arrivals") },
      secondary: { href: "/search?tag=todays-deal", label: t("Today's deals link") },
      image: cover("Sunglasses") ?? "/images/categories/sunglasses.jpg",
      tone: "accent",
    },
    deals.length > 0 && {
      id: "deals",
      label: t("Slide deals"),
      eyebrow: t("Today's Deals"),
      title: t("Up to off", { percent: bestDeal }),
      body: t("Deals body"),
      cta: { href: "/search?tag=todays-deal", label: t("Shop deals") },
      image: cover("Shoes") ?? "/images/categories/shoes.jpg",
      tone: "deal",
    },
    cover("Pants") && {
      id: "denim",
      label: t("Slide denim"),
      eyebrow: t("Best Sellers"),
      title: t("Denim that lasts"),
      body: t("Denim body"),
      cta: { href: "/search?category=Pants", label: t("Shop jeans") },
      image: cover("Pants")!,
      tone: "accent",
    },
    categorySlide("watches", "Wrist Watches", "watches"),
    categorySlide("bags", "Bags", "bags"),
    categorySlide("dresses", "Dresses", "dresses"),
  ].filter(Boolean) as HeroSlide[];

  return (
    <Container className="flex flex-col gap-12 pb-16 pt-5 md:gap-[72px] md:pb-20 md:pt-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <HeroSlider slides={heroSlides} dir={dir} />

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
                <Image src={dealTile.images[0]} alt="" fill sizes="140px" className={cn(fit(dealTile.images[0]), "dark:rounded-md dark:mix-blend-normal")} />
              </span>
            </Link>
          )}
          {jeans && (
            <Link
              href="/search?category=Pants"
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
                <Image src={jeans.images[0]} alt="" fill sizes="140px" className={cn(fit(jeans.images[0]), "dark:mix-blend-normal")} />
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
              <div key={col.title} className={cardVariants({ size: "lg", className: "flex flex-col gap-4" })}>
                <h3 className="text-xl font-bold">{col.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {col.items.slice(0, 4).map((p) => (
                    <Link
                      key={p._id.toString()}
                      href={`/product/${p.slug}`}
                      aria-label={p.name}
                      className="group relative flex h-[130px] items-center justify-center rounded-md bg-media md:h-[150px]"
                    >
                      <span className={cn("relative", isLookPhoto(p.images[0]) ? "size-full overflow-hidden rounded-md" : "size-[80%]")}>
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="150px"
                          className={cn(fit(p.images[0]), "rounded-none transition-transform duration-slow ease-standard group-hover:scale-105")}
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
      <section className="flex flex-col gap-6 rounded-2xl bg-inverse px-6 py-8 text-inverse-foreground md:px-14 md:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="flex max-w-[520px] flex-col gap-2.5">
          <h2 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[38px]">
            {t("Newsletter title")}
          </h2>
          <p className="text-base text-inverse-muted">{t("Newsletter body")}</p>
        </div>
        <NewsletterForm />
      </section>
    </Container>
  );
}
