import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// 1 … 4 5 6 … 10 — returns page numbers with null for gaps.
function pageList(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

// Numbered pagination as links. In RTL "previous" sits on the right and its
// chevron points right (icons flip with the reading direction).
export default async function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number | string;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  const t = await getTranslations("Search");
  const current = Number(page) || 1;
  const box =
    "flex size-9 items-center justify-center rounded-sm border border-border bg-card text-sm font-semibold text-foreground transition-colors duration-fast hover:border-foreground";
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label={t("Pagination")} className="flex items-center justify-center gap-1.5">
      <Link
        href={hrefFor(Math.max(1, current - 1))}
        aria-label={t("Previous page")}
        aria-disabled={current <= 1}
        className={cn(box, current <= 1 && disabled)}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Link>
      {pageList(current, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden className="w-6 text-center text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === current ? "page" : undefined}
            aria-label={t("Page n", { n: p })}
            className={cn(box, "tabular-nums", p === current && "border-primary bg-primary text-primary-foreground")}
          >
            {p}
          </Link>
        )
      )}
      <Link
        href={hrefFor(Math.min(totalPages, current + 1))}
        aria-label={t("Next page")}
        aria-disabled={current >= totalPages}
        className={cn(box, current >= totalPages && disabled)}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Link>
    </nav>
  );
}
