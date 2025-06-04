"use client";
import React, { useMemo } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn, round2 } from "@/lib/utils";
import { useTranslations, useFormatter } from "next-intl";

interface IProps {
  price: number;
  listPrice?: number;
  className?: string;
  isDeal?: boolean;

  plain?: boolean;
  forListing?: boolean;
}

export default function ProductPrice({
  price,
  className,
  isDeal = false,
  listPrice = 0,

  forListing = true,
  plain = false,
}: IProps) {
  const t = useTranslations();
  const format = useFormatter();

  const { currencyName, rate, symbols } = useCurrency({
    from: "USD",
    amount: price,
  });

  const convertedPrice = useMemo(
    () => round2((rate as number) * price),
    [rate, price]
  );
  const convertedListPrice = useMemo(
    () => round2((rate as number) * listPrice),
    [rate, listPrice]
  );

  const discountPercent = useMemo(() => {
    if (!convertedListPrice) return 0;
    return Math.round(100 - (convertedPrice / convertedListPrice) * 100);
  }, [convertedPrice, convertedListPrice]);

  const [intValue, floatValue] = useMemo(() => {
    const stringValue = convertedPrice.toString();
    return stringValue.includes(".")
      ? stringValue.split(".")
      : [stringValue, ""];
  }, [convertedPrice]);

  return plain ? (
    format.number(convertedPrice, {
      style: "currency",
      currency: currencyName,
      currencyDisplay: "narrowSymbol",
    })
  ) : convertedListPrice == 0 ? (
    <div className={cn("text-3xl", className)}>
      <span className="text-xs align-super">{symbols}</span>
      {intValue}
      <span className="text-xs align-super">{floatValue}</span>
    </div>
  ) : isDeal ? (
    <div className="space-y-2">
      <div className="flex justify-center items-center gap-2">
        <span className="bg-red-700 rounded-sm p-1 text-white text-sm font-semibold">
          {discountPercent}% {t("Product.Off")}
        </span>
        <span className="text-red-700 text-xs font-bold">
          {t("Product.Limited time deal")}
        </span>
      </div>
      <div
        className={`flex ${forListing && "justify-center"} items-center gap-2`}
      >
        <div className={cn("text-3xl", className)}>
          <span className="text-xs align-super">{symbols}</span>
          {intValue}
          <span className="text-xs align-super">{floatValue}</span>
        </div>
        <div className="text-muted-foreground text-xs py-2">
          {t("Product.Was")}:{" "}
          <span className="line-through">
            {format.number(convertedListPrice, {
              style: "currency",
              currency: currencyName,
              currencyDisplay: "narrowSymbol",
            })}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <div className="">
      <div className="flex justify-center gap-3">
        <div className="text-3xl text-orange-700">-{discountPercent}%</div>
        <div className={cn("text-3xl", className)}>
          <span className="text-xs align-super">{symbols}</span>
          {intValue}
          <span className="text-xs align-super">{floatValue}</span>
        </div>
      </div>
      <div className="text-muted-foreground text-xs py-2">
        {t("Product.List price")}:{" "}
        <span className="line-through">
          {format.number(convertedListPrice, {
            style: "currency",
            currency: currencyName,
            currencyDisplay: "narrowSymbol",
          })}
        </span>
      </div>
    </div>
  );
}
