import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Price from "@/components/shared/price";
import { Link } from "@/i18n/routing";
import { PRICE_RANGES, RATINGS, SearchParams, searchHref } from "@/lib/search";
import { cn, toSlug } from "@/lib/utils";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("size-4 text-[#B45309]", i <= n && "fill-[#B45309]")}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

// Filter groups. `list` = sidebar radios (desktop); `chips` = pills (sheet/drawer).
export default async function FilterPanel({
  params,
  categories,
  tags,
  variant = "list",
}: {
  params: SearchParams;
  categories: string[];
  tags: string[];
  variant?: "list" | "chips";
}) {
  const t = await getTranslations("Search");
  const tc = await getTranslations("Categories");
  const tt = await getTranslations("Tags");
  const cur = (v?: string) => v ?? "all";

  const groups: {
    key: keyof SearchParams;
    title: string;
    options: { value: string; label: React.ReactNode }[];
  }[] = [
    {
      key: "category",
      title: t("Department"),
      options: [
        { value: "all", label: t("All") },
        ...categories.map((c) => ({ value: c, label: tc.has(c) ? tc(c) : c })),
      ],
    },
    {
      key: "price",
      title: t("Price"),
      options: [
        { value: "all", label: t("All") },
        ...PRICE_RANGES.map((r) => ({
          value: r.value,
          label: (
            <span className="inline-flex gap-1">
              <Price amount={r.from} whole />
              <span>{t("to")}</span>
              <Price amount={r.to} whole />
            </span>
          ),
        })),
      ],
    },
    {
      key: "tag",
      title: t("Tag"),
      options: [
        { value: "all", label: t("All") },
        ...tags.map((x) => {
          const slug = toSlug(x);
          return { value: slug, label: tt.has(slug) ? tt(slug) : x };
        }),
      ],
    },
  ];

  const ratingOptions = [
    { value: "all", label: t("All") as React.ReactNode },
    ...RATINGS.map((r) => ({
      value: r,
      label: (
        <span className="flex items-center gap-2">
          <Stars n={Number(r)} />
          <span className="sr-only">{t("stars", { count: Number(r) })}</span>
          {t("& Up")}
        </span>
      ),
    })),
  ];

  const allGroups = [
    ...groups,
    { key: "rating" as const, title: t("Customer Review"), options: ratingOptions },
  ];

  if (variant === "chips") {
    return (
      <div className="flex flex-col gap-[18px]">
        {allGroups.map((g) => (
          <fieldset key={g.key} className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-bold">{g.title}</legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = cur(params[g.key]) === o.value;
                return (
                  <Link
                    key={o.value}
                    replace
                    scroll={false}
                    href={searchHref(params, { [g.key]: o.value })}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex h-10 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors duration-fast",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card text-foreground hover:border-foreground"
                    )}
                  >
                    {o.label}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 py-2">
      {allGroups.map((g, i) => (
        <nav
          key={g.key}
          aria-label={g.title}
          className={cn("flex flex-col gap-3 py-5", i < allGroups.length - 1 && "border-b border-border")}
        >
          <h2 className="text-[15px] font-bold">{g.title}</h2>
          <ul className="flex flex-col gap-2.5">
            {g.options.map((o) => {
              const on = cur(params[g.key]) === o.value;
              return (
                <li key={o.value}>
                  <Link
                    scroll={false}
                    href={searchHref(params, { [g.key]: o.value })}
                    aria-current={on ? "true" : undefined}
                    className="group flex min-h-6 items-center gap-2.5 text-sm text-foreground"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-muted-foreground transition-colors duration-fast group-hover:border-foreground",
                        on && "border-2 border-primary"
                      )}
                    >
                      {on && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className={cn(on && "font-bold")}>{o.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ))}
    </div>
  );
}
