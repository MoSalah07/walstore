"use client";

import Image from "next/image";
import { ArrowLeft, Bookmark, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { BrowsingHistoryTiles } from "@/components/shared/browsing-history-list";
import FreeShippingMeter from "@/components/shared/cart/free-shipping-meter";
import Price from "@/components/shared/price";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { PricingConfig, calcPrices } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/use-cart-store";
import useWishlist from "@/store/use-wishlist";

export default function CartView({ pricing }: { pricing: PricingConfig }) {
  const t = useTranslations("Cart");
  const mounted = useMounted();
  const { cart, updateItem, removeItem } = useCartStore();
  const toggleWish = useWishlist((s) => s.toggle);
  const hasWish = useWishlist((s) => s.has);
  const items = mounted ? cart.items : [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const p = calcPrices(items, "standard", pricing);

  if (!mounted) {
    return (
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-7 flex flex-col gap-12 md:gap-[72px]">
        <EmptyState
          className={cardVariants({ flush: true, className: "py-16" })}
          icon={<ShoppingBag />}
          title={t("Your Shopping Cart is empty")}
          description={t.rich("Empty help", { price: () => <Price amount={pricing.freeShippingMin} whole /> })}
          actions={
            <>
              <Link href="/" className={buttonVariants()}>
                {t("Continue shopping")}
              </Link>
              <Link href="/search?tag=todays-deal" className={buttonVariants({ variant: "outline" })}>
                {t("Today's Deals")}
              </Link>
            </>
          }
        />
        <BrowsingHistoryTiles />
      </div>
    );
  }

  const checkout = (
    <Link href="/checkout" className={cn(buttonVariants({ size: "xl" }), "w-full")}>
      <Lock aria-hidden />
      {t("Proceed to Checkout")}
    </Link>
  );

  return (
    <>
      <p className="-mt-1 text-sm text-foreground-secondary md:hidden">{t("items count", { count })}</p>
      <div className="mt-5 grid items-start gap-6 md:mt-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <section aria-label={t("Cart items")} className={cardVariants({ flush: true, className: "flex flex-col" })}>
          <div className="hidden h-[52px] items-center justify-between border-b border-border px-7 text-[13px] font-bold uppercase tracking-[0.06em] text-foreground-secondary md:flex">
            <span>{t("Product")}</span>
            <span>{t("Price")}</span>
          </div>
          <ul>
            {items.map((item) => {
              const href = `/product/${item.slug}`;
              const meta = [item.color, item.size].filter(Boolean).join(" · ");
              return (
                <li key={item.clientId} className="flex gap-4 border-b border-border p-4 md:gap-6 md:px-7 md:py-6">
                  <Link
                    href={href}
                    tabIndex={-1}
                    aria-hidden
                    className="relative flex size-24 shrink-0 items-center justify-center rounded-lg bg-media md:size-[140px]"
                  >
                    <span className="relative size-[80%]">
                      <Image src={item.image} alt="" fill sizes="140px" className="object-contain mix-blend-multiply" />
                    </span>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={href} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline md:text-[17px]">
                        {item.name}
                      </Link>
                      <div className="hidden shrink-0 flex-col items-end gap-1 text-end md:flex md:w-[140px]">
                        <Price amount={item.price * item.quantity} className="font-display text-[22px] font-extrabold" />
                        {item.quantity > 1 && (
                          <span className="text-[13px] text-foreground-secondary">
                            {t.rich("each", { price: () => <Price amount={item.price} /> })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                      {meta && <span>{meta}</span>}
                      <span className="font-semibold text-success-fg">{t("In Stock")}</span>
                    </div>
                    <Price amount={item.price * item.quantity} className="font-display text-lg font-extrabold md:hidden" />
                    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 pt-1 md:gap-4">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.countInStock}
                        onChange={(n) => updateItem(item, n)}
                        onRemove={() => removeItem(item)}
                        size="sm"
                        labels={{ decrease: t("Decrease quantity"), increase: t("Increase quantity"), remove: t("Delete") }}
                        className="md:h-11"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          removeItem(item);
                          toast.success(t("Removed", { name: item.name.slice(0, 40) }));
                        }}
                        className={buttonVariants({ variant: "ghost", size: "sm", className: "text-foreground-secondary hover:text-foreground" })}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        {t("Delete")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!hasWish(item.product)) toggleWish(item.product);
                          removeItem(item);
                          toast.success(t("Saved for later toast"));
                        }}
                        className={buttonVariants({ variant: "ghost", size: "sm", className: "text-foreground-secondary hover:text-foreground" })}
                      >
                        <Bookmark className="size-4" aria-hidden />
                        {t("Save for later")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex h-16 items-center justify-end gap-2 px-4 text-[15px] md:px-7 md:text-[17px]">
            {t("Subtotal items", { count })}: <Price amount={p.itemsPrice} className="font-extrabold" />
          </div>
        </section>

        <aside aria-label={t("Order summary")} className="flex flex-col gap-4 lg:sticky lg:top-44">
          <div className={cardVariants({ size: "lg", className: "flex flex-col gap-5" })}>
            <FreeShippingMeter remaining={p.remainingForFree} progress={p.progress} />
            <dl className="flex flex-col gap-3 border-t border-border pt-5 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">{t("Subtotal items", { count })}</dt>
                <dd className="font-semibold"><Price amount={p.itemsPrice} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">{t("Shipping")}</dt>
                <dd className="font-semibold">
                  {p.freeShipping ? <span className="text-success-fg">{t("FREE")}</span> : <Price amount={p.shippingPrice} />}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">{t("Tax")}</dt>
                <dd className="text-foreground-secondary">{t("Calculated at checkout")}</dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between border-t border-border pt-5">
              <span className="text-[17px] font-bold">{t("Total")}</span>
              <Price
                amount={p.itemsPrice + p.shippingPrice}
                className="font-display text-[32px] font-extrabold tracking-[-0.02em]"
              />
            </div>
            <div className="hidden md:block">{checkout}</div>
            <span className="text-center text-[13px] text-foreground-secondary">{t("Secure checkout easy returns")}</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 self-center text-[15px] font-semibold">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t("Continue shopping")}
          </Link>
        </aside>
      </div>

      <BrowsingHistoryTiles className="mt-12 md:mt-[72px]" />

      {/* Phone: total + checkout replaces the tab bar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3.5 border-t border-border bg-card px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-foreground-secondary">{t("Total")}</span>
          <Price amount={p.itemsPrice + p.shippingPrice} className="font-display text-[22px] font-extrabold" />
        </div>
        <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
          {t("Proceed to Checkout")}
        </Link>
      </div>
    </>
  );
}
