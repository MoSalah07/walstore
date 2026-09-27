"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/use-cart-store";

export function useCartCount() {
  const items = useCartStore((s) => s.cart.items);
  const mounted = useMounted();
  return mounted ? items.reduce((n, i) => n + i.quantity, 0) : 0;
}

// Orange count badge: the cart count is the one non-deal use of accent.deal.
export function CartCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -end-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-deal px-1 text-[11px] font-bold leading-none text-deal-foreground tabular-nums",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function CartButton({ showLabel = true }: { showLabel?: boolean }) {
  const t = useTranslations("Header");
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      aria-label={t("Cart items", { count })}
      className={cn(
        "flex items-center gap-2.5 rounded-md text-foreground transition-colors duration-fast hover:bg-sunken",
        showLabel ? "h-12 px-3" : "size-11 justify-center"
      )}
    >
      <span className="relative flex">
        <ShoppingBag className={showLabel ? "size-6" : "size-[22px]"} strokeWidth={1.8} />
        <CartCount count={count} />
      </span>
      {showLabel && <span className="text-sm font-bold">{t("Cart")}</span>}
    </Link>
  );
}
