"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";
import { SORT_ORDERS, SearchParams, searchHref } from "@/lib/search";
import { cn } from "@/lib/utils";

// Native select in a pill: accessible and good on touch.
export default function ProductSortSelector({
  sort,
  params,
  compact = false,
}: {
  sort: string;
  params: SearchParams;
  compact?: boolean;
}) {
  const t = useTranslations("Search");
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className={cn("text-sm text-foreground-secondary", compact && "sr-only")}>
        {t("Sort by")}
      </label>
      <div className="relative">
        <select
          id={id}
          value={sort}
          onChange={(e) => router.push(searchHref(params, { sort: e.target.value }), { scroll: false })}
          className={cn(
            "cursor-pointer appearance-none rounded-full border border-input bg-card pe-10 ps-4 text-sm font-semibold text-foreground outline-none transition-colors duration-fast hover:border-foreground focus-visible:border-foreground",
            compact ? "h-[38px] border-[1.5px] text-[13px]" : "h-11"
          )}
        >
          {SORT_ORDERS.map((s) => (
            <option key={s} value={s}>
              {t(`sort.${s}`)}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2" />
      </div>
    </div>
  );
}
