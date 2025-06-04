import { Separator } from "@/components/ui/separator";
import { IProduct } from "@/interfaces/product.interface";
import { getTranslations } from "next-intl/server";
import React from "react";
import ProductPrice from "../home/ProductPrice";
import SelectVariant from "./SelectVariant";

export default async function ProductDescription({
  product,
  color,
  size,
}: {
  product: IProduct;
  color: string;
  size: string;
}) {
  const t = await getTranslations("Product");
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-1 text-gray-700 dark:text-white">
          <span>{t("Brand")}</span>
          <span> {product?.brand} </span>
          <span> {product?.category}</span>
        </p>
        <h1 className="text-lg md:text-xl font-bold">{product?.name}</h1>
        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <ProductPrice
              price={product?.price}
              listPrice={product?.listPrice}
              plain
            />
          </div>
        </div>
      </div>
      <div>
        <SelectVariant product={product} color={color} size={size} />
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col gap-2">
        <p className="text-bold text-gray-600 dark:text-white/75">
          {t("Description")}:
        </p>
        <p className="font-medium lg:font-semibold">{product?.description}</p>
      </div>
    </>
  );
}
