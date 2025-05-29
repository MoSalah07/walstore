"use client";
import React from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn, round2 } from "@/lib/utils";
import { useTranslations, useFormatter } from "next-intl";

interface IProps {
  price: number;
  listPrice?: number;
  className?: string;
  isDeal?: boolean;
  showDetails?: boolean;
}

export default function ProductPrice({
  price,
  className,
  // isDeal = false,
  listPrice = 0,
  showDetails = false,
}: IProps) {
  const t = useTranslations();
  const format = useFormatter();

  const { currencyName, rate, isLoading, symbols } = useCurrency({
    from: "USD",
    amount: price,
  });

  if (isLoading) return null;

  const convertedPrice = round2((rate as number) * price);
  const convertedListPrice = round2((rate as number) * listPrice);
  const discountPercent = Math.round(
    100 - (convertedPrice / convertedListPrice) * 100
  );

  const stringValue = convertedPrice.toString();
  const [intValue, floatValue] = stringValue.includes(".")
    ? stringValue.split(".")
    : [stringValue, ""];

  return (
    <div>
      {isFinite(discountPercent) && (
        <div className="flex justify-center items-center gap-2">
          <span className="bg-red-700 rounded-sm p-1 text-white text-sm font-semibold mb-1">
            {discountPercent}% {t("Product.Off")}
          </span>
          <span className="text-red-700 text-xs font-bold">
            {t("Product.Limited time deal")}
          </span>
        </div>
      )}

      <div className={`flex  items-center gap-2`}>
        <div className={cn("text-3xl", className)}>
          <span className="text-xs align-super">{symbols}</span>
          {intValue}
          <span className="text-xs align-super">{floatValue}</span>
        </div>
        {!showDetails && (
          <div className="text-muted-foreground text-xs py-2">
            {t("Product.Was")}:{" "}
            <span className="line-through">
              {format.number(convertedListPrice, {
                style: "currency",
                currency: currencyName,
                currencyDisplay: "code",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
