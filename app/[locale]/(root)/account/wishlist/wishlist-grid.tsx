"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import ProductCard, { ProductCardData } from "@/components/shared/home/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import useWishlist from "@/store/use-wishlist";

export default function WishlistGrid() {
  const t = useTranslations("Account");
  const mounted = useMounted();
  const ids = useWishlist((s) => s.ids);
  const [products, setProducts] = useState<(ProductCardData & { _id: string })[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!mounted) return;
    if (!key) return setProducts([]);
    const ctrl = new AbortController();
    fetch(`/api/products/browsing-history?type=history&ids=${key}&categories=all`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [mounted, key]);

  if (!mounted || products === null) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[302/470] rounded-lg" />
        ))}
      </div>
    );
  }

  const visible = products.filter((p) => ids.includes(p._id));
  if (visible.length === 0) {
    return (
      <EmptyState
        className={cardVariants({ flush: true })}
        icon={<Heart />}
        title={t("Wishlist empty")}
        description={t("Wishlist empty help")}
        actions={
          <Link href="/search" className={buttonVariants()}>
            {t("Start shopping")}
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3">
      {visible.map((p) => (
        <li key={p._id}>
          <ProductCard product={p} hideAddOnMobile />
        </li>
      ))}
    </ul>
  );
}
