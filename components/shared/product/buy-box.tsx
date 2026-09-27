"use client";

import { useState } from "react";
import { CheckCircle2, Heart, PackageCheck, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import Price from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cardVariants } from "@/components/ui/card";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { swatchFor } from "@/lib/colors";
import { cn, generateId, round2 } from "@/lib/utils";
import useCartStore from "@/store/use-cart-store";
import useWishlist from "@/store/use-wishlist";

export type BuyBoxProduct = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  price: number;
  listPrice: number;
  countInStock: number;
  colors: string[];
  sizes: string[];
};

export default function BuyBox({
  product,
  freeShippingMin,
}: {
  product: BuyBoxProduct;
  freeShippingMin: number;
}) {
  const t = useTranslations("Product");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mounted = useMounted();
  const addItem = useCartStore((s) => s.addItem);
  const cartTotal = useCartStore((s) => s.cart.items.reduce((n, i) => n + i.price * i.quantity, 0));
  const saved = useWishlist((s) => s.ids.includes(product._id)) && mounted;
  const toggleWish = useWishlist((s) => s.toggle);

  const [color, setColor] = useState(
    product.colors.includes(params.get("color") ?? "") ? params.get("color")! : product.colors[0]
  );
  const [size, setSize] = useState(
    product.sizes.includes(params.get("size") ?? "") ? params.get("size")! : product.sizes[0]
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<number | null>(null);

  const inStock = product.countInStock > 0;
  const save = product.listPrice > product.price ? product.listPrice - product.price : 0;
  const remaining = Math.max(0, freeShippingMin - (mounted ? cartTotal : 0) - product.price * qty);

  const pick = (next: { color?: string; size?: string }) => {
    const c = next.color ?? color;
    const s = next.size ?? size;
    if (next.color) setColor(next.color);
    if (next.size) setSize(next.size);
    setAdded(null);
    const sp = new URLSearchParams();
    if (c) sp.set("color", c);
    if (s) sp.set("size", s);
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };

  const add = () => {
    try {
      addItem(
        {
          clientId: generateId(),
          product: product._id,
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: qty,
          image: product.images[0],
          size,
          color,
        },
        qty
      );
      return true;
    } catch {
      toast.error(t("Not enough stock"));
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      <div className="flex flex-col gap-1 border-y border-border py-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Price amount={product.price} className="font-display text-[32px] font-extrabold tracking-[-0.03em] md:text-[44px]" />
          {save > 0 && (
            <>
              <span className="text-sm text-foreground-secondary md:text-base">
                <span className="hidden md:inline">{t("List price")}: </span>
                <Price amount={product.listPrice} strike />
              </span>
              <span className="text-sm font-bold text-deal md:text-base">
                {t.rich("You save", { price: () => <Price amount={save} /> })}
              </span>
            </>
          )}
        </div>
        <span className="text-sm text-foreground-secondary">{t("Tax at checkout")}</span>
      </div>

      {/* Color */}
      {product.colors.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[15px]">
            <span className="font-bold">{t("Color")}:</span> {color}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pick({ color: c })}
                aria-pressed={c === color}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-full bg-card pe-4 ps-2 text-sm font-semibold text-foreground transition-colors duration-fast",
                  c === color ? "border-2 border-primary" : "border-[1.5px] border-input hover:border-foreground"
                )}
              >
                <span
                  aria-hidden
                  className="size-[30px] rounded-full border border-input"
                  style={{ background: swatchFor(c) }}
                />
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Size */}
      {product.sizes.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[15px]">
            <span className="font-bold">{t("Size")}:</span> {size}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pick({ size: s })}
                aria-pressed={s === size}
                className={cn(
                  "h-11 min-w-12 rounded-full bg-card px-4 text-sm font-semibold transition-colors duration-fast",
                  s === size
                    ? "border-2 border-primary bg-primary text-primary-foreground"
                    : "border-[1.5px] border-input text-foreground hover:border-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Actions */}
      {inStock ? (
        <>
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={qty}
              max={product.countInStock}
              onChange={(n) => {
                setQty(n);
                setAdded(null);
              }}
              labels={{ decrease: t("Decrease quantity"), increase: t("Increase quantity"), remove: t("Decrease quantity") }}
              className="h-14 [&_button]:w-[52px] [&_output]:w-8 [&_output]:text-[17px]"
            />
            <Button
              size="xl"
              className="flex-1"
              onClick={() => {
                if (add()) {
                  setAdded(qty);
                  toast.success(t("Added to Cart"));
                }
              }}
            >
              <ShoppingBag aria-hidden />
              {t("Add to Cart")}
            </Button>
            <button
              type="button"
              onClick={() => toast.success(toggleWish(product._id) ? t("Saved to wishlist") : t("Removed from wishlist"))}
              aria-pressed={saved}
              aria-label={saved ? t("Remove from wishlist") : t("Save to wishlist")}
              className="flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-input bg-card text-foreground transition-colors duration-fast hover:border-foreground"
            >
              <Heart className={cn("size-5", saved && "fill-deal text-deal")} strokeWidth={1.8} />
            </button>
          </div>
          <Button
            size="xl"
            variant="secondary"
            onClick={() => {
              if (add()) router.push("/checkout");
            }}
          >
            {t("Buy Now")}
          </Button>
          {added !== null && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-[14px] bg-success-bg px-4 py-3.5 text-[15px] font-semibold text-success-fg"
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                {t("Added summary", { qty: added, variant: [color, size].filter(Boolean).join(" · ") || "—" })}
              </span>
              <Link href="/cart" className="shrink-0 underline underline-offset-2">
                {t("Go to Cart")}
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className={cardVariants({ size: "sm", className: "flex flex-col gap-3" })}>
          <span className="font-bold text-destructive">{t("Out of Stock")}</span>
          <span className="text-sm text-foreground-secondary">{t("Out of stock help")}</span>
          <Button
            variant="outline"
            onClick={() => toast.success(toggleWish(product._id) ? t("Saved to wishlist") : t("Removed from wishlist"))}
          >
            <Heart aria-hidden className={cn(saved && "fill-deal text-deal")} />
            {saved ? t("Saved") : t("Save to wishlist")}
          </Button>
        </div>
      )}

      {/* Info card */}
      <ul className={cardVariants({ flush: true, className: "flex flex-col" })}>
        <li className="flex items-start gap-3.5 border-b border-border px-5 py-4">
          <PackageCheck className={cn("mt-0.5 size-5 shrink-0", inStock ? "text-success" : "text-destructive")} aria-hidden />
          <span className="flex flex-col gap-0.5">
            <span className={cn("font-bold", inStock ? "text-success-fg" : "text-destructive")}>
              {inStock ? t("In Stock") : t("Out of Stock")}
            </span>
            {inStock && (
              <span className="text-sm text-foreground-secondary">
                {product.countInStock <= 3
                  ? t("Only Left", { count: product.countInStock })
                  : t("available ships from", { count: product.countInStock })}
              </span>
            )}
          </span>
        </li>
        <li className="flex items-start gap-3.5 border-b border-border px-5 py-4">
          <Truck className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="flex flex-col gap-0.5">
            <span className="font-bold">
              {remaining > 0
                ? t.rich("Add for free shipping", { price: () => <Price amount={remaining} /> })
                : t("Qualifies for free shipping")}
            </span>
            <span className="text-sm text-foreground-secondary">
              {t.rich("Orders over ship free", { price: () => <Price amount={freeShippingMin} whole /> })}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-3.5 px-5 py-4">
          <RotateCcw className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="flex flex-col gap-0.5">
            <span className="font-bold">{t("Returns & Replacements")}</span>
            <Link href="/page/returns" className="text-sm underline-offset-4 hover:underline">
              {t("See the return policy")}
            </Link>
          </span>
        </li>
      </ul>

      {/* Phone: sticky price + add bar (the tab bar hides on product pages). */}
      {inStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-border bg-card px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 md:hidden">
          <div className="flex flex-col leading-tight">
            <Price amount={product.price} className="font-display text-xl font-extrabold" />
            {save > 0 && <Price amount={product.listPrice} strike className="text-xs text-muted-foreground" />}
          </div>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              if (add()) {
                setAdded(qty);
                toast.success(t("Added to Cart"));
              }
            }}
          >
            {t("Add to Cart")}
          </Button>
        </div>
      )}
    </div>
  );
}
