import { Button } from "@/components/ui/button";
import { IProduct } from "@/interfaces/product.interface";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

interface IProps {
  product: IProduct;
  color: string;
  size: string;
}

export default async function SelectVariant({ color, size, product }: IProps) {
  const selectedColor = color || product.colors[0];
  const selectedSize = size || product.sizes[0];
  const t = await getTranslations("Product");
  return (
    <>
      {product.colors.length > 0 && (
        <div className="space-x-2 space-y-2">
          <div className="text-gray-600 dark:text-white/75">{t("Color")}:</div>
          {product.colors.map((color: string) => (
            <Button
              asChild
              variant="outline"
              className={
                selectedColor === color ? "border-2 border-primary" : "border-2"
              }
              key={color}
            >
              <Link
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: color,
                  size: selectedSize,
                })}`}
                key={color}
              >
                <div
                  style={{ backgroundColor: color }}
                  className="h-4 w-4 rounded-full border border-muted-foreground"
                ></div>
                {color}
              </Link>
            </Button>
          ))}
        </div>
      )}
      {product.sizes.length > 0 && (
        <div className="mt-2 space-x-2 space-y-2">
          <div className="text-gray-600 dark:text-white/75">{t("Size")}:</div>
          {product.sizes.map((size: string) => (
            <Button
              asChild
              variant="outline"
              className={
                selectedSize === size
                  ? "border-2  border-primary"
                  : "border-2  "
              }
              key={size}
            >
              <Link
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: selectedColor,
                  size: size,
                })}`}
              >
                {size}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </>
  );
}
