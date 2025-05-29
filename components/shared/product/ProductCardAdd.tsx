import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import ProductPrice from "../home/ProductPrice";
import { IProduct } from "@/interfaces/product.interface";
import { getTranslations } from "next-intl/server";
import { generateId, round2 } from "@/lib/utils";
import AddToCart from "./AddToCart";

export default async function ProductCardAdd({
  price,
  product,
  size,
  color,
}: {
  price: number;
  product: IProduct;
  size: string;
  color: string;
}) {
  const t = await getTranslations("Product");

  return (
    <Card className=" h-[40vh] mt-4 md:mt-0">
      <CardContent className="p-4 flex flex-col gap-4">
        <ProductPrice price={price} showDetails />

        {product?.countInStock > 0 && product?.countInStock <= 3 && (
          <div className="text-destructive font-bold">
            {t("Only X left in stock - order soon", {
              count: product?.countInStock,
            })}
          </div>
        )}
        {product?.countInStock !== 0 ? (
          <div className="text-green-700 text-base font-semibold">
            {t("In Stock")}
          </div>
        ) : (
          <div className="text-destructive text-base font-semibold">
            {t("Out of Stock")}
          </div>
        )}

        {product.countInStock !== 0 && (
          <div className="flex justify-center items-center">
            <AddToCart
              item={{
                clientId: generateId(),
                product: product._id.toString(),
                countInStock: product.countInStock,
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: round2(product.price),
                quantity: 1,
                image: product.images[0],
                size: size || product.sizes[0],
                color: color || product.colors[0],
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
