"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { ProductCardData } from "@/components/shared/home/ProductCard";
import ProductRail from "@/components/shared/home/product-rail";
import SectionHeading from "@/components/shared/home/section-heading";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import useBrowsingHistoryStore from "@/store/use-browsing-history";

type Item = ProductCardData & { _id: string };

function useHistoryProducts(type: "history" | "related", excludeId = "") {
  const { products } = useBrowsingHistoryStore();
  const mounted = useMounted();
  const [data, setData] = useState<Item[]>([]);
  const ids = products.map((p) => p.id).join(",");
  const categories = products.map((p) => p.category).join(",");

  useEffect(() => {
    if (!mounted || !ids) return;
    const ctrl = new AbortController();
    fetch(
      `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${encodeURIComponent(categories)}&ids=${ids}`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Item[]) => setData(Array.isArray(d) ? d.filter((p) => p._id !== excludeId) : []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [mounted, ids, categories, type, excludeId]);

  return data;
}

// "Your browsing history": square photo tiles.
export function BrowsingHistoryTiles({ className }: { className?: string }) {
  const t = useTranslations("Home");
  const items = useHistoryProducts("history");
  if (items.length === 0) return null;
  return (
    <section className={cn("flex flex-col gap-4 md:gap-6", className)}>
      <SectionHeading
        size="h3"
        title={t("Your browsing history")}
        action={{ label: t("Related to items that you've viewed"), href: `/search?category=${encodeURIComponent(items[0].category)}` }}
      />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:gap-5 md:px-0">
        {items.map((p) => (
          <Link
            key={p._id}
            href={`/product/${p.slug}`}
            aria-label={p.name}
            title={p.name}
            className="relative flex size-[104px] shrink-0 items-center justify-center rounded-[14px] border border-border bg-card transition-colors duration-fast hover:border-foreground dark:bg-[#E9ECF1] md:size-[140px]"
          >
            <span className="relative size-[76%]">
              <Image src={p.images[0]} alt="" fill sizes="140px" className="object-contain mix-blend-multiply" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// "Related to items that you've viewed": product rail.
export function RelatedToHistory({ excludeId, className }: { excludeId?: string; className?: string }) {
  const t = useTranslations("Home");
  const items = useHistoryProducts("related", excludeId);
  if (items.length === 0) return null;
  return (
    <ProductRail
      title={t("Related to items that you've viewed")}
      products={items.slice(0, 12)}
      carousel={items.length > 4}
      action={{ label: t("View all"), href: `/search?category=${encodeURIComponent(items[0].category)}` }}
      className={className}
    />
  );
}

export default function BrowsingHistoryList({ excludeId, className }: { excludeId?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-12 md:gap-[72px]", className)}>
      <RelatedToHistory excludeId={excludeId} />
      <BrowsingHistoryTiles />
    </div>
  );
}
