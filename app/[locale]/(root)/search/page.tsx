import { SearchX, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getAllCategories, getAllProducts, getAllTags } from "@/actions/product.action";
import ProductSortSelector from "@/components/shared/add-to-browsing-history/product-sort-selector";
import Container from "@/components/shared/container";
import ProductCard from "@/components/shared/home/ProductCard";
import Pagination from "@/components/shared/pagination/pagination";
import Price from "@/components/shared/price";
import FilterPanel from "@/components/shared/search/filter-panel";
import FilterSheet from "@/components/shared/search/filter-sheet";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { PRICE_RANGES, SearchParams, activeFilters, searchHref } from "@/lib/search";

type Props = { searchParams: Promise<SearchParams> };

async function getLabels() {
  const [t, tc, tt] = await Promise.all([
    getTranslations("Search"),
    getTranslations("Categories"),
    getTranslations("Tags"),
  ]);
  return {
    t,
    category: (c: string) => (tc.has(c) ? tc(c) : c),
    tag: (x: string) => (tt.has(x) ? tt(x) : x),
  };
}

export async function generateMetadata(props: Props) {
  const params = await props.searchParams;
  const { t, category, tag } = await getLabels();
  const title =
    params.q && params.q !== "all"
      ? t("Results for", { q: params.q })
      : params.category && params.category !== "all"
        ? category(params.category)
        : params.tag && params.tag !== "all"
          ? tag(params.tag)
          : t("Search Products");
  return { title };
}

export default async function SearchPage(props: Props) {
  const raw = await props.searchParams;
  const params: SearchParams = {
    q: raw.q,
    category: raw.category,
    tag: raw.tag,
    price: raw.price,
    rating: raw.rating,
    sort: raw.sort,
    page: raw.page,
  };
  const sort = params.sort ?? "best-selling";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ t, category, tag }, categories, tags, data] = await Promise.all([
    getLabels(),
    getAllCategories(),
    getAllTags(),
    getAllProducts({
      category: params.category ?? "all",
      tag: params.tag ?? "all",
      query: params.q ?? "all",
      price: params.price ?? "all",
      rating: params.rating ?? "all",
      page,
      sort,
    }),
  ]);

  const active = activeFilters(params);
  const title =
    params.q && params.q !== "all"
      ? t("Results for", { q: params.q })
      : params.category && params.category !== "all"
        ? category(params.category)
        : params.tag && params.tag !== "all"
          ? tag(params.tag)
          : t("All products");

  const chipLabel = (k: (typeof active)[number]): React.ReactNode => {
    const v = params[k]!;
    if (k === "q") return `“${v}”`;
    if (k === "category") return `${t("Category")}: ${category(v)}`;
    if (k === "tag") return `${t("Tag")}: ${tag(v)}`;
    if (k === "rating") return `${t("Rating")}: ${t("n stars & up", { n: Number(v) })}`;
    const r = PRICE_RANGES.find((x) => x.value === v);
    return r ? (
      <span className="inline-flex gap-1">
        {t("Price")}: <Price amount={r.from} whole /> – <Price amount={r.to} whole />
      </span>
    ) : `${t("Price")}: ${v}`;
  };

  const countText =
    data.totalProducts === 0
      ? t("No results count")
      : t("range of total", { from: data.from, to: data.to, total: data.totalProducts });

  return (
    <Container className="flex flex-col pb-16 pt-4 md:pb-20 md:pt-8">
      <Breadcrumb
        className="hidden md:block"
        label={t("Breadcrumb")}
        items={[
          { label: t("Home"), href: "/" },
          { label: t("Search"), href: "/search" },
          ...(title !== t("All products") ? [{ label: title }] : []),
        ]}
      />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 md:mt-3">
        <h1 className="type-h1 text-[26px] leading-8 md:text-[44px]">{title}</h1>
        <span className="text-[13px] text-foreground-secondary tabular-nums md:text-[15px]">{countText}</span>
      </div>

      {/* Toolbar: chips + sort (desktop) / filters + sort buttons (phone, tablet). */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:mt-6 md:min-h-12">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSheet
            total={data.totalProducts}
            activeCount={active.length}
            clearHref="/search"
          >
            <FilterPanel params={params} categories={categories} tags={tags} variant="chips" />
          </FilterSheet>
          {active.length > 0 && (
            <>
              <span className="me-1 hidden text-sm font-semibold lg:inline">{t("Filters")}:</span>
              {active.map((k) => (
                <Link
                  key={k}
                  href={searchHref(params, { [k]: "all" })}
                  className="hidden h-9 items-center gap-1.5 rounded-full border border-primary bg-secondary pe-2.5 ps-3.5 text-sm font-semibold text-primary-hover transition-colors duration-fast hover:bg-border dark:text-foreground md:flex"
                >
                  {chipLabel(k)}
                  <X className="size-3.5" strokeWidth={2.4} aria-hidden />
                  <span className="sr-only">{t("Remove filter")}</span>
                </Link>
              ))}
              <Link href="/search" className="ms-2 hidden text-sm font-semibold underline-offset-4 hover:underline md:inline">
                {t("Clear")}
              </Link>
            </>
          )}
        </div>
        <ProductSortSelector sort={sort} params={params} />
      </div>

      <div className="mt-4 flex items-start gap-8 md:mt-6">
        <aside aria-label={t("Filters")} className={cardVariants({ flush: true, className: "hidden w-[280px] shrink-0 lg:block" })}>
          <FilterPanel params={params} categories={categories} tags={tags} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {data.products.length === 0 ? (
            <EmptyState
              className={cardVariants({ flush: true, className: "py-16" })}
              icon={<SearchX />}
              title={params.q ? t("No results for", { q: params.q }) : t("No product found")}
              description={t("Check the spelling")}
              actions={
                <>
                  {categories.map((c: string) => (
                    <Link
                      key={c}
                      href={`/search?category=${encodeURIComponent(c)}`}
                      className="flex h-9 items-center rounded-full border border-input px-3.5 text-[13px] font-semibold hover:border-foreground"
                    >
                      {category(c)}
                    </Link>
                  ))}
                  {active.length > 0 && (
                    <Link href="/search" className="basis-full pt-1.5 text-sm font-bold underline-offset-4 hover:underline">
                      {t("Clear all filters")}
                    </Link>
                  )}
                </>
              }
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3">
              {data.products.map((product, i) => (
                <li key={product._id.toString()}>
                  <ProductCard product={product} priority={i < 3} hideAddOnMobile />
                </li>
              ))}
            </ul>
          )}
          {data.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              hrefFor={(p) => searchHref(params, { page: String(p) })}
            />
          )}
          {data.products.length > 0 && (
            <p className="text-sm text-foreground-secondary">
              {t("Check each product page for other buying options")}
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
