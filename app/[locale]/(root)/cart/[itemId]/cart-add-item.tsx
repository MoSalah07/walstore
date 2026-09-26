"use client";

import Image from "next/image";
import { Check, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import BrowsingHistoryList from "@/components/shared/browsing-history-list";
import FreeShippingMeter from "@/components/shared/cart/free-shipping-meter";
import Price from "@/components/shared/price";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { PricingConfig, calcPrices } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/use-cart-store";

export default function CartAddItem({ itemId, pricing }: { itemId: string; pricing: PricingConfig }) {
  const t = useTranslations("Cart");
  const mounted = useMounted();
  const items = useCartStore((s) => s.cart.items);
  const item = items.find((x) => x.clientId === itemId);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const p = calcPrices(items, "standard", pricing);

  if (!mounted) return <Skeleton className="h-[220px] rounded-xl" />;

  if (!item) {
    return (
      <EmptyState
        className="rounded-xl border border-border bg-card"
        icon={<SearchX />}
        title={t("Item not in cart")}
        description={t("Item not in cart help")}
        actions={
          <Link href="/cart" className={buttonVariants()}>
            {t("Go to Cart")}
          </Link>
        }
      />
    );
  }

  const meta = [
    item.color && `${t("Color")}: ${item.color}`,
    item.size && `${t("Size")}: ${item.size}`,
    `${t("Qty")} ${item.quantity}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-12 md:gap-[72px]">
      <section className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <div role="status" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 md:gap-6 md:p-7">
          <span className="relative flex size-24 shrink-0 items-center justify-center rounded-lg bg-sunken dark:bg-[#E9ECF1] md:size-[140px]">
            <span className="relative size-[80%]">
              <Image src={item.image} alt="" fill sizes="140px" className="object-contain mix-blend-multiply" />
            </span>
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex items-center gap-2.5 text-lg font-bold text-success-fg md:text-[22px]">
              <span className="flex size-7 items-center justify-center rounded-full bg-success md:size-8">
                <Check className="size-4 text-white" strokeWidth={3} aria-hidden />
              </span>
              {t("Added to cart")}
            </span>
            <Link href={`/product/${item.slug}`} className="line-clamp-2 font-semibold hover:underline">
              {item.name}
            </Link>
            <span className="text-sm text-foreground-secondary">
              {meta.join(" · ")} · <Price amount={item.price} />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center md:gap-7 md:p-7">
          <div className="flex flex-1 flex-col gap-2.5">
            <FreeShippingMeter remaining={p.remainingForFree} progress={p.progress} />
            <span className="mt-1.5 text-base">
              {t("Cart subtotal")}{" "}
              <Price amount={p.itemsPrice} className="ms-1.5 font-display text-[26px] font-extrabold" />
            </span>
          </div>
          <div className="flex flex-col gap-2.5 sm:w-60">
            <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              {t("Proceed to checkout n", { count })}
            </Link>
            <Link href="/cart" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}>
              {t("Go to Cart")}
            </Link>
          </div>
        </div>
      </section>

      <BrowsingHistoryList excludeId={item.product} />
    </div>
  );
}
