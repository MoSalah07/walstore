"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Pill search. Desktop adds a department picker on the start side.
export default function SearchBar({
  categories = [],
  compact = false,
  className,
}: {
  categories?: string[];
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("Header");
  const tc = useTranslations("Categories");
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setCategory(params.get("category") ?? "all");
  }, [params]);

  const label = (c: string) => (tc.has(c) ? tc(c) : c);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (category !== "all") sp.set("category", category);
    router.push(`/search${sp.size ? `?${sp}` : ""}`);
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        "flex h-12 min-w-0 items-center overflow-hidden rounded-full border-[1.5px] border-foreground bg-card transition-shadow duration-fast focus-within:shadow-[0_0_0_4px_rgb(var(--secondary))]",
        compact && "h-11",
        className
      )}
    >
      {!compact && categories.length > 0 && (
        <div className="relative hidden h-full shrink-0 border-e border-border bg-background lg:block">
          <label htmlFor={`${id}-cat`} className="sr-only">
            {t("Search in")}
          </label>
          <select
            id={`${id}-cat`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-full cursor-pointer appearance-none bg-transparent pe-9 ps-5 text-sm font-semibold text-foreground outline-none"
          >
            <option value="all">{t("All")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute end-3.5 top-1/2 size-3.5 -translate-y-1/2"
          />
        </div>
      )}
      <label htmlFor={`${id}-q`} className="sr-only">
        {t("Search label")}
      </label>
      <input
        id={`${id}-q`}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={compact ? t("Search short") : t("Search")}
        autoComplete="off"
        enterKeyHint="search"
        className="h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          aria-label={t("Clear search")}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
      <button
        type="submit"
        aria-label={t("Search label")}
        className={cn(
          "me-1 flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-fast hover:bg-primary-hover",
          compact ? "h-9 w-9" : "h-[38px] w-11"
        )}
      >
        <SearchIcon className="size-[18px]" strokeWidth={2.2} />
      </button>
    </form>
  );
}
