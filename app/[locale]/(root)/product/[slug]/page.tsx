import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getProductBySlug, getRelatedProductsByCategory } from "@/actions/product.action";
import AddToBrowsingHistory from "@/components/shared/add-to-browsing-history";
import BrowsingHistoryList from "@/components/shared/browsing-history-list";
import Container from "@/components/shared/container";
import ProductRail from "@/components/shared/home/product-rail";
import ProductGallery from "@/components/shared/product/ProductGallery";
import BuyBox from "@/components/shared/product/buy-box";
import ProductDetails from "@/components/shared/product/product-details";
import ProductReviews from "@/components/shared/product/product-reviews";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getPricingConfig } from "@/lib/settings";
import { Link } from "@/i18n/routing";
import { discountPercent } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("Product");
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: t("Product Not Found"), description: t("Product Not Access") };
  const description = product.description?.slice(0, 150);
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, tc, tt, related, pricing] = await Promise.all([
    getTranslations("Product"),
    getTranslations("Categories"),
    getTranslations("Tags"),
    getRelatedProductsByCategory({
      category: product.category,
      productId: product._id.toString(),
      page: 1,
      limit: 8,
    }),
    getPricingConfig(),
  ]);
  const id = product._id.toString();
  const category = tc.has(product.category) ? tc(product.category) : product.category;
  const off = discountPercent(product.price, product.listPrice);
  const isDeal = product.tags.includes("todays-deal");
  const shortName = product.name.split(/[,(]/)[0].split(" ").slice(0, 5).join(" ");

  const specs = [
    { k: t("Brand"), v: product.brand },
    { k: t("Category"), v: category },
    ...(product.colors.length ? [{ k: t("Colors"), v: product.colors.join(", ") }] : []),
    ...(product.sizes.length ? [{ k: t("Sizes"), v: product.sizes.join(", ") }] : []),
    {
      k: t("Availability"),
      v: product.countInStock > 0 ? t("n in stock", { count: product.countInStock }) : t("Out of Stock"),
    },
  ];

  return (
    <Container className="flex flex-col pb-16 pt-4 md:pb-20 md:pt-8">
      <AddToBrowsingHistory id={id} category={product.category} />
      <Breadcrumb
        label={t("Breadcrumb")}
        items={[
          { label: t("Home"), href: "/" },
          { label: category, href: `/search?category=${encodeURIComponent(product.category)}` },
          { label: shortName },
        ]}
      />

      <section className="mt-4 grid grid-cols-1 gap-6 md:mt-6 md:gap-8 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:gap-12">
        <ProductGallery
          images={product.images}
          name={product.name}
          badge={
            off > 0 ? (
              <Badge variant="deal" className="px-3 py-1.5 text-[13px]">
                -{off}%{isDeal && ` · ${t("Limited time deal")}`}
              </Badge>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/search?q=${encodeURIComponent(product.brand)}`}
                className="type-overline text-[13px] tracking-[0.06em] hover:underline"
              >
                {product.brand}
              </Link>
              {product.tags
                .filter((x) => x !== "todays-deal")
                .map((x) => (
                  <Badge key={x} variant={x === "new-arrival" ? "neutral" : "muted"} size="sm">
                    {tt.has(x) ? tt(x) : x}
                  </Badge>
                ))}
            </div>
            <h1 className="font-display text-[26px] font-extrabold leading-[1.12] tracking-[-0.03em] md:text-4xl md:leading-[1.1]">
              {product.name}
            </h1>
          </div>
          <BuyBox
            freeShippingMin={pricing.freeShippingMin}
            product={{
              _id: id,
              name: product.name,
              slug: product.slug,
              category: product.category,
              images: product.images,
              price: product.price,
              listPrice: product.listPrice,
              countInStock: product.countInStock,
              colors: product.colors,
              sizes: product.sizes,
            }}
          />
        </div>
      </section>

      <section id="reviews" className="mt-10 scroll-mt-44 md:mt-[72px]">
        <ProductDetails
          description={product.description}
          specs={specs}
          reviewCount={product.numReviews ?? 0}
          reviews={<ProductReviews productId={id} slug={product.slug} avgRating={product.avgRating} numReviews={product.numReviews} />}
        />
      </section>

      {related?.data && related.data.length > 0 && (
        <ProductRail
          className="mt-12 md:mt-[72px]"
          title={t("Best Sellers in", { name: category })}
          products={related.data}
          action={{ label: t("View all"), href: `/search?category=${encodeURIComponent(product.category)}` }}
        />
      )}

      <BrowsingHistoryList excludeId={id} className="mt-12 md:mt-[72px]" />
    </Container>
  );
}
