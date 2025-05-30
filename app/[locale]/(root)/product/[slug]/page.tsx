import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from "@/actions/product.action";
import AddToBrowsingHistory from "@/components/shared/add-to-browsing-history";
import BrowsingHistoryList from "@/components/shared/browsing-history-list";
import Container from "@/components/shared/container";
import ProductSlider from "@/components/shared/home/ProductSlider";
import ProductCardAdd from "@/components/shared/product/ProductCardAdd";
import ProductDescription from "@/components/shared/product/ProductDescription";
import ProductGallery from "@/components/shared/product/ProductGallery";
import { Separator } from "@/components/ui/separator";
import { IProduct } from "@/interfaces/product.interface";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("Product");
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: t("Product Not Found"),
      description: t("Product Not Access"),
    };
  }

  return {
    title: `${product.name}`,
    description: product.description?.slice(0, 150),
    openGraph: {
      title: `${product.name}`,
      description: product.description?.slice(0, 150),
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page: string; color: string; size: string }>;
}) {
  const { slug } = await params;
  const { color, size } = await searchParams;
  const t = await getTranslations("Product");
  const product = await getProductBySlug(slug);

  const relatedProducts = await getRelatedProductsByCategory({
    category: product?.category as string,
    productId: product?._id.toString() as string,
    page: Number("1"),
  });

  return (
    <div>
      <AddToBrowsingHistory
        id={product?._id.toString() as string}
        category={product?.category as string}
      />
      <section>
        <Container className="py-5">
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="col-span-2">
              <ProductGallery images={product?.images as string[]} />
            </div>
            <div className="flex flex-col gap-2 md:p-5 col-span-2 w-full mt-8 md:mt-0">
              <ProductDescription
                product={product as IProduct}
                color={color}
                size={size}
              />
            </div>
            <ProductCardAdd
              price={product?.price as number}
              product={product as IProduct}
              size={size}
              color={color}
            />
          </div>
          <Separator className="mt-4" />
        </Container>

        <section>
          <ProductSlider
            products={relatedProducts?.data as IProduct[]}
            title={t("Best Sellers in", {
              name: product?.category as string,
            })}
          />
        </section>
        <section>
          <BrowsingHistoryList />
        </section>
      </section>
    </div>
  );
}
