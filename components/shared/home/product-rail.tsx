"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import ProductCard, { ProductCardData } from "./ProductCard";
import SectionHeading from "./section-heading";
import { cn } from "@/lib/utils";

// Phones: swipeable row. Desktop: 4-up grid, or a paged row with arrows.
export default function ProductRail({
  title,
  products,
  action,
  badge,
  carousel = false,
  className,
}: {
  title: string;
  products: ProductCardData[];
  action?: { label: string; href: string };
  badge?: React.ReactNode;
  carousel?: boolean;
  className?: string;
}) {
  const t = useTranslations("Home");
  const rtl = useLocale() === "ar";
  const row = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  const page = (dirn: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    el.scrollBy({ left: dirn * el.clientWidth * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <section className={cn("flex flex-col gap-4 md:gap-6", className)}>
      <SectionHeading title={title} badge={badge} action={carousel ? undefined : action}>
        {carousel && (
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => page(-1)}
              aria-label={t("Previous")}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-fast hover:border-foreground"
            >
              <ChevronLeft className="size-[18px] rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => page(1)}
              aria-label={t("Next")}
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-fast hover:bg-primary-hover"
            >
              <ChevronRight className="size-[18px] rtl:rotate-180" />
            </button>
          </div>
        )}
      </SectionHeading>
      <div
        ref={row}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:gap-6 md:px-0",
          !carousel && "md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4"
        )}
      >
        {products.map((p) => (
          <div
            key={p._id.toString()}
            className={cn(
              "w-[164px] shrink-0 snap-start md:w-auto",
              carousel && "md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)]"
            )}
          >
            <ProductCard product={p} hideAddOnMobile />
          </div>
        ))}
      </div>
    </section>
  );
}
