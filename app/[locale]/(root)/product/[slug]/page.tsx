import {
  getProductBySlug,
  // getRelatedProductsByCategory,
} from "@/actions/product.action";
import Container from "@/components/shared/container";
import ProductCardAdd from "@/components/shared/product/ProductCardAdd";
import ProductDescription from "@/components/shared/product/ProductDescription";
import ProductGallery from "@/components/shared/product/ProductGallery";
import { IProduct } from "@/interfaces/product.interface";
import React from "react";

export default async function ProductDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page: string; color: string; size: string }>;
}) {
  const { slug } = await params;
  const { color, size } = await searchParams;

  const product = await getProductBySlug(slug);

  // const relatedProducts = await getRelatedProductsByCategory({
  //   category: product?.category as string,
  //   productId: product?._id.toString() as string,
  //   page: Number("1"),
  // });

  return (
    <div>
      <section>
        <Container className="grid grid-cols-1 md:grid-cols-5 py-5">
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
        </Container>
      </section>
    </div>
  );
}
