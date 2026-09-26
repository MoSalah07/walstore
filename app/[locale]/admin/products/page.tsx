import { PackageSearch, Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getAdminProducts } from "@/actions/admin-product.action";
import { LOW_STOCK } from "@/constants";
import Pagination from "@/components/shared/pagination/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import ProductsTable from "./products-table";

type SP = { q?: string; category?: string; stock?: string; page?: string; saved?: string };

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.products") };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = sp.category ?? "all";
  const stock = ["low", "out", "draft"].includes(sp.stock ?? "") ? sp.stock! : "all";
  const [t, tc, data] = await Promise.all([
    getTranslations("AdminProducts"),
    getTranslations("Categories"),
    getAdminProducts({ q: sp.q, category, stock, page }),
  ]);

  const href = (patch: Partial<SP>) => {
    const next = { q: sp.q, category, stock, ...patch };
    const qs = new URLSearchParams();
    if (next.q) qs.set("q", next.q);
    if (next.category && next.category !== "all") qs.set("category", next.category);
    if (next.stock && next.stock !== "all") qs.set("stock", next.stock);
    if (next.page && next.page !== "1") qs.set("page", next.page);
    const s = qs.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };
  const chips = [
    { label: t("All"), on: category === "all" && stock === "all", href: href({ category: "all", stock: "all", page: undefined }) },
    ...data.categories.map((c) => ({ label: tc.has(c) ? tc(c) : c, on: category === c, href: href({ category: c, stock: "all", page: undefined }) })),
    { label: t("Low stock"), on: stock === "low", href: href({ stock: "low", category: "all", page: undefined }) },
    { label: t("Drafts"), on: stock === "draft", href: href({ stock: "draft", category: "all", page: undefined }) },
  ];
  const from = data.total === 0 ? 0 : (page - 1) * 10 + 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Products")}</h1>
          <p className="text-[15px] text-foreground-secondary">
            {t("summary", { total: data.stats.total, categories: data.stats.categories, low: data.stats.low })}
          </p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants({ size: "sm" }), "h-[38px] rounded-[10px]")}>
          <Plus aria-hidden />
          {t("Add product")}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <form role="search" className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-input bg-card px-3 focus-within:border-foreground md:max-w-[320px]">
          {category !== "all" && <input type="hidden" name="category" value={category} />}
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="p-q" className="sr-only">{t("Search products")}</label>
          <input id="p-q" name="q" type="search" defaultValue={sp.q} placeholder={t("Search placeholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
        <nav aria-label={t("Filters")} className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              aria-current={c.on ? "true" : undefined}
              className={cn(
                "flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold",
                c.on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-foreground"
              )}
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card">
        {data.products.length === 0 ? (
          <EmptyState
            icon={<PackageSearch />}
            title={t("No products")}
            description={t("No products help")}
            actions={<Link href="/admin/products" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("Clear filters")}</Link>}
          />
        ) : (
          <ProductsTable products={data.products} savedId={sp.saved} lowStock={LOW_STOCK} />
        )}
        {data.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 md:flex-row">
            <span className="text-[13px] text-foreground-secondary tabular-nums">{t("showing", { from, to: Math.min(page * 10, data.total), total: data.total })}</span>
            {data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />}
          </div>
        )}
      </section>
    </div>
  );
}
