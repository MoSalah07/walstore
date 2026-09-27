import { Download, PackageOpen, Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminOrders } from "@/actions/admin-order.action";
import Pagination from "@/components/shared/pagination/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import OrdersTable from "./orders-table";

const TABS = ["all", "unpaid", "processing", "shipped", "delivered", "cancelled"] as const;
const PERIODS = ["today", "7d", "30d", "all"] as const;
const PAYMENTS = ["all", "cod", "card", "paypal"] as const;

type SP = { status?: string; q?: string; period?: string; payment?: string; page?: string };

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.orders") };
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = TABS.includes(sp.status as (typeof TABS)[number]) ? sp.status! : "all";
  const period = PERIODS.includes(sp.period as (typeof PERIODS)[number]) ? sp.period! : "30d";
  const payment = PAYMENTS.includes(sp.payment as (typeof PAYMENTS)[number]) ? sp.payment! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, to, locale, data] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("Orders"),
    getLocale(),
    getAdminOrders({ status, q: sp.q, period, payment, page, limit: 10 }),
  ]);

  const href = (patch: Partial<SP>) => {
    const next = { status, q: sp.q, period, payment, ...patch };
    const qs = new URLSearchParams();
    if (next.status !== "all") qs.set("status", next.status!);
    if (next.q) qs.set("q", next.q);
    if (next.period !== "30d") qs.set("period", next.period!);
    if (next.payment !== "all") qs.set("payment", next.payment!);
    if (next.page && next.page !== "1") qs.set("page", next.page);
    const s = qs.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };
  const exportQs = new URLSearchParams({ status, period, payment, ...(sp.q ? { q: sp.q } : {}) });
  const from = data.total === 0 ? 0 : (page - 1) * 10 + 1;
  const to_ = Math.min(page * 10, data.total);
  const select = "h-9 rounded-sm border border-input bg-card px-2.5 text-[13px] font-semibold outline-none focus-visible:border-foreground";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("nav.orders")}</h1>
          <p className="text-[15px] text-foreground-secondary">{t("orders in period", { count: data.counts.all ?? 0, period: t(`periodLong.${period}`) })}</p>
        </div>
        <a href={`/api/admin/orders-csv?${exportQs}`} className={buttonVariants({ variant: "outline", size: "md" })}>
          <Download aria-hidden />
          {t("Export CSV")}
        </a>
      </div>

      <nav aria-label={t("Order status")} className="-mx-4 flex gap-6 overflow-x-auto px-4 shadow-[inset_0_-1px_0_rgb(var(--border))] scrollbar-none md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={href({ status: tab, page: undefined })}
            aria-current={tab === status ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 text-sm",
              tab === status ? "font-bold shadow-[inset_0_-2px_0_rgb(var(--foreground))]" : "font-semibold text-foreground-secondary hover:text-foreground"
            )}
          >
            {tab === "all" ? t("All") : to(`status.${tab}`)}
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{data.counts[tab] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap items-center gap-2.5" role="search">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-input bg-card px-3 focus-within:border-foreground md:max-w-[320px]">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="o-q" className="sr-only">{t("Search orders")}</label>
          <input id="o-q" name="q" type="search" defaultValue={sp.q} placeholder={t("Search orders placeholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <label className="sr-only" htmlFor="o-period">{t("Period")}</label>
        <select id="o-period" name="period" defaultValue={period} className={select}>
          {PERIODS.map((p) => <option key={p} value={p}>{t(`periodLong.${p}`)}</option>)}
        </select>
        <label className="sr-only" htmlFor="o-pay">{t("col.payment")}</label>
        <select id="o-pay" name="payment" defaultValue={payment} className={select}>
          {PAYMENTS.map((p) => <option key={p} value={p}>{p === "all" ? t("All payments") : to(`payment.${p}`)}</option>)}
        </select>
        <button type="submit" className={buttonVariants({ size: "md" })}>{t("Apply")}</button>
        <span className="ms-auto hidden text-[13px] text-muted-foreground md:inline">{t("Sorted by newest")}</span>
      </form>

      <section className={cardVariants({ flush: true, className: "overflow-hidden" })}>
        {data.orders.length === 0 ? (
          <EmptyState
            icon={<PackageOpen />}
            title={t("No orders match")}
            description={t("No orders match help")}
            actions={<Link href="/admin/orders?period=all" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("Show all orders")}</Link>}
          />
        ) : (
          <OrdersTable orders={data.orders} locale={locale} />
        )}
        {data.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 md:flex-row">
            <span className="text-[13px] text-foreground-secondary tabular-nums">{t("showing", { from, to: to_, total: data.total })}</span>
            {data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />}
          </div>
        )}
      </section>
    </div>
  );
}
