"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import Price from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { IProduct } from "@/interfaces/product.interface";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { discountPercent } from "@/lib/format";
import { cn, generateId, isLookPhoto, round2 } from "@/lib/utils";
import useCartStore from "@/store/use-cart-store";
import useWishlist from "@/store/use-wishlist";

export type ProductCardData = Pick<
  IProduct,
  "name" | "slug" | "brand" | "images" | "price" | "listPrice" | "tags" | "countInStock" | "category" | "sizes" | "colors"
> & { _id: string | { toString(): string } };

// Image well · deal/new badge · wishlist · brand · 2-line name · price · add.
export default function ProductCard({
  product,
  className,
  hideAddToCart = false,
  hideAddOnMobile = false,
  priority = false,
}: {
  product: ProductCardData;
  className?: string;
  hideAddToCart?: boolean;
  /** Phone rails show the compact 164px card without the button. */
  hideAddOnMobile?: boolean;
  priority?: boolean;
  /** @deprecated kept for older call sites */
  hideDetails?: boolean;
  /** @deprecated kept for older call sites */
  hideBorder?: boolean;
}) {
  const t = useTranslations("Product");
  const id = product._id.toString();
  const off = discountPercent(product.price, product.listPrice);
  const isNew = product.tags?.includes("new-arrival");
  const href = `/product/${product.slug}`;
  const addItem = useCartStore((s) => s.addItem);
  const mounted = useMounted();
  const saved = useWishlist((s) => s.ids.includes(id)) && mounted;
  const toggleWish = useWishlist((s) => s.toggle);
  const soldOut = product.countInStock <= 0;

  // Hover gallery: the pointer's position across the image picks the photo.
  // Extra photos only load after the first hover.
  const photos = product.images.slice(0, 4);
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState(false);
  const rtl = useRef(false);
  const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || photos.length < 2) return;
    rtl.current = getComputedStyle(e.currentTarget).direction === "rtl";
    setWarm(true);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || photos.length < 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const i = Math.floor((rtl.current ? 1 - x : x) * photos.length);
    setActive(Math.min(photos.length - 1, Math.max(0, i)));
  };

  const add = () => {
    try {
      addItem(
        {
          clientId: generateId(),
          product: id,
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: 1,
          image: product.images[0],
          size: product.sizes?.[0],
          color: product.colors?.[0],
        },
        1
      );
      toast.success(
        <span className="flex flex-col gap-0.5">
          <strong>{t("Added to Cart")}</strong>
          <span className="line-clamp-1 text-inverse-muted">{product.name}</span>
        </span>
      );
    } catch {
      toast.error(t("Not enough stock"));
    }
  };

  return (
    <article
      className={cardVariants({
        variant: "interactive",
        flush: true,
        className: cn("group flex h-full flex-col overflow-hidden", className),
      })}
    >
      <div
        className="relative aspect-[302/280] shrink-0 overflow-hidden bg-media"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(0)}
      >
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          {photos.map((src, i) =>
            i === 0 || warm ? (
              <span
                key={src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-base ease-standard",
                  !isLookPhoto(src) && "p-[13%]",
                  i === active ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="relative block size-full">
                  <Image
                    src={src}
                    alt=""
                    fill
                    priority={priority && i === 0}
                    sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 50vw"
                    className={cn(
                      "transition-transform duration-slow ease-standard group-hover:scale-[1.04]",
                      isLookPhoto(src) ? "object-cover" : "object-contain mix-blend-multiply"
                    )}
                  />
                </span>
              </span>
            ) : null
          )}
        </Link>
        {photos.length > 1 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 bottom-2.5 hidden gap-1 opacity-0 transition-opacity duration-fast group-hover:opacity-100 [@media(hover:hover)]:flex"
          >
            {photos.map((src, i) => (
              <span
                key={src}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-colors duration-fast",
                  i === active ? "bg-media-foreground" : "bg-media-foreground/20"
                )}
              />
            ))}
          </div>
        )}
        {off > 0 ? (
          <Badge variant="deal" className="absolute start-3.5 top-3.5">
            -{off}%
          </Badge>
        ) : (
          isNew && (
            <Badge className="absolute start-3.5 top-3.5">{t("New")}</Badge>
          )
        )}
        <button
          type="button"
          onClick={() => {
            const now = toggleWish(id);
            toast.success(now ? t("Saved to wishlist") : t("Removed from wishlist"));
          }}
          aria-pressed={saved}
          aria-label={saved ? t("Remove from wishlist") : t("Save to wishlist")}
          className={buttonVariants({ variant: "outline", size: "icon-md", shape: "pill", className: "absolute end-2.5 top-2.5" })}
        >
          <Heart
            className={cn("size-[18px]", saved && "fill-deal text-deal")}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 md:gap-2 md:p-4">
        <div className="type-overline truncate text-[11px] font-semibold tracking-[0.06em] text-muted-foreground md:text-xs">
          {product.brand}
        </div>
        <Link
          href={href}
          className="line-clamp-2 min-h-[35px] text-[13px] leading-[18px] text-foreground hover:underline hover:underline-offset-2 md:min-h-[42px] md:text-[15px] md:leading-[21px]"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <Price amount={product.price} className="type-price text-lg md:text-[22px]" />
          {off > 0 && (
            <Price amount={product.listPrice} strike className="text-[13px] text-muted-foreground" />
          )}
        </div>
        {!hideAddToCart && (
          <Button
            variant="outline"
            onClick={add}
            disabled={soldOut}
            className={cn("mt-1 w-full font-semibold", hideAddOnMobile && "hidden md:inline-flex")}
          >
            {!soldOut && <Plus aria-hidden />}
            {soldOut ? t("Out of Stock") : t("Add to cart short")}
          </Button>
        )}
      </div>
    </article>
  );
}
