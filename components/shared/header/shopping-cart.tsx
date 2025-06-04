"use client";
import React, { useMemo } from "react";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import useCartStore from "@/store/use-cart-store";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";
import { round2 } from "@/lib/utils";

export default function ShoppingCart() {
  const {
    cart: { items },
    totalItemsPrice,
  } = useCartStore();

  const itemsPrice: number = totalItemsPrice(items);

  const { rate, symbols } = useCurrency({
    from: "USD",
    amount: itemsPrice,
  });

  const t = useTranslations("Header");

  const convertedPrice = useMemo(
    () => round2((rate as number) * itemsPrice),
    [rate, itemsPrice]
  );

  return (
    <div className="size-20 hover-effect hover:bg-black/50 rounded-lg flex-center">
      <Link href={`/cart`} className="relative">
        <ShoppingCartIcon className="text-white mb-1 mr-1" />
        <span className="absolute -top-1 -right-2 bg-yellow-600 text-white size-4 rounded-lg flex-center text-xs font-bold">
          {items.length}
        </span>

        <div className="text-white text-[10px] font-semibold flex-center flex-col">
          {rate && !isNaN(convertedPrice) && (
            <span>
              {symbols}
              {convertedPrice}
            </span>
          )}
          <span>{t("Cart")}</span>
        </div>
      </Link>
    </div>
  );
}
