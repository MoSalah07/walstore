"use client";
import React from "react";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import useCartStore from "@/store/use-cart-store";
import { useTranslations } from "next-intl";

export default function ShoppingCart() {
  const {
    cart: { items },
  } = useCartStore();

  const t = useTranslations("Header");

  return (
    <div className="size-20 hover-effect hover:bg-black/50 rounded-lg flex-center">
      <Link href={`/cart`} className="relative">
        <ShoppingCartIcon className="text-white" />
        <span className="absolute -top-1 -right-2 bg-yellow-600 text-white size-4 rounded-lg flex-center text-xs font-bold">
          {items.length}
        </span>
        <div className="text-white text-[10px] font-semibold flex-center flex-col">
          <span>2000</span>
          <span>{t("Cart")}</span>
        </div>
      </Link>
    </div>
  );
}
