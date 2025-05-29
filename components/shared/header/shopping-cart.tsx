import React from "react";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

export default function ShoppingCart() {
  return (
    <div className="size-16 hover-effect hover:bg-black/50 rounded-lg flex-center">
      <Link href={`/cart`} className="relative">
        <ShoppingCartIcon className="text-white" />
        <span className="absolute -top-1 -right-2 bg-yellow-500 size-4 rounded-lg flex-center text-xs font-semibold">
          1
        </span>
        <span className="text-white text-[10px] font-semibold">2000</span>
      </Link>
    </div>
  );
}
