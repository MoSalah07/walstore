import Image from "next/image";
import { PackageOpen, Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getMyAccount } from "@/actions/account.action";
import { getMyOrders } from "@/actions/order.action";
import AccountNav from "@/components/shared/account/account-nav";
import Container from "@/components/shared/container";
import CancelOrderButton from "@/components/shared/order/cancel-order-button";
import Pagination from "@/components/shared/pagination/pagination";
import Price from "@/components/shared/price";
import { StatusPill } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = ["all", "open", "delivered", "cancelled"] as const;

export async function generateMetadata() {
  const t = await getTranslations("Account");
  return { title: t("Your orders") };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = TABS.includes(sp.status as (typeof TABS)[number]) ? sp.status! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, to, locale, account, data] = await Promise.all([
    getTranslations("Account"),
    getTranslations("Orders"),
    getLocale(),
    getMyAccount(),
    getMyOrders({ page, status, q: sp.q, limit: 8 }),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status, q: sp.q, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && v !== "all" && next.set(k, v));
    const qs = next.toString();
    return `/account/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <Container className="flex flex-col gap-6 pb-16 pt-6 md:pb-20 md:pt-10 lg:flex-row lg:items-start lg:gap-8">
      <AccountNav name={account?.name ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col gap-5 md:gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="type-h1">{t("Your orders")}</h1>
          <form className="flex gap-2" action="" role="search">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <label htmlFor="o-search" className="sr-only">
              {t("Search all orders")}
            </label>
            <input
              id="o-search"
              name="q"
              type="search"
              defaultValue={sp.q}
              placeholder={t("Search all orders")}
              className="h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-input bg-card px-[18px] text-[15px] outline-none focus-visible:border-foreground md:w-[280px]"
            />
            <button type="submit" className={cn(buttonVariants(), "shrink-0")}>
              <Search aria-hidden />
              <span className="sr-only md:not-sr-only">{t("Search")}</span>
            </button>
          </form>
        </div>

        <nav aria-label={t("Order status")} className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
          {TABS.map((tab) => (
            <Link
              key={tab}
              href={href({ status: tab, page: undefined })}
              aria-current={tab === status ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center rounded-full border-[1.5px] px-[18px] text-sm font-semibold transition-colors duration-fast",
                tab === status ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-foreground"
              )}
            >
              {t(`tab.${tab}`)}
            </Link>
          ))}
        </nav>

        {data.orders.length === 0 ? (
          <EmptyState
            className="rounded-xl border border-border bg-card"
            icon={<PackageOpen />}
            title={sp.q || status !== "all" ? t("No orders match") : t("No orders yet")}
            description={sp.q || status !== "all" ? t("No orders match help") : t("No orders yet help")}
            actions={
              <Link href={sp.q || status !== "all" ? "/account/orders" : "/"} className={buttonVariants()}>
                {sp.q || status !== "all" ? t("Show all orders") : t("Start shopping")}
              </Link>
            }
          />
        ) : (
          data.orders.map((o) => {
            const open = ["unpaid", "processing"].includes(o.status);
            const first = o.items[0];
            const names = o.items.map((i) => i.name.split(/[,(]/)[0]);
            return (
              <article key={o._id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-border bg-background-subtle px-5 py-4 text-[13px] md:flex md:gap-10 md:px-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold uppercase tracking-[0.06em] text-foreground-secondary">{t("Order placed")}</span>
                    <span className="text-sm">{formatDate(o.createdAt, locale)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold uppercase tracking-[0.06em] text-foreground-secondary">{t("Total")}</span>
                    <Price amount={o.totalPrice} className="text-sm font-bold" />
                  </div>
                  <div className="hidden flex-col gap-0.5 md:flex">
                    <span className="font-semibold uppercase tracking-[0.06em] text-foreground-secondary">{t("Ship to")}</span>
                    <span className="text-sm">{o.shippingAddress.fullName}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-0.5 md:ms-auto md:flex-col md:items-end">
                    <span className="font-semibold uppercase tracking-[0.06em] text-foreground-secondary" dir="ltr">
                      #{o.orderNumber}
                    </span>
                    <Link href={`/account/orders/${o._id}`} className="text-sm font-bold underline-offset-4 hover:underline">
                      {t("View order details")}
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:gap-6 md:p-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                    <StatusPill status={o.status} className="self-start text-[13px]">
                      {to(`status.${o.status}`)}
                    </StatusPill>
                    <div className="flex gap-3">
                      {o.items.slice(0, 4).map((i, idx) => (
                        <Link
                          key={idx}
                          href={`/product/${i.slug}`}
                          aria-label={i.name}
                          className="relative flex size-[72px] items-center justify-center rounded-[14px] bg-sunken dark:bg-[#E9ECF1] md:size-[88px]"
                        >
                          <span className="relative size-[80%]">
                            <Image src={i.image} alt="" fill sizes="88px" className="object-contain mix-blend-multiply" />
                          </span>
                        </Link>
                      ))}
                    </div>
                    <span className="line-clamp-2 text-[15px] text-foreground/80">{names.join(", ")}</span>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2.5 md:w-[220px]">
                    {open ? (
                      <>
                        <Link href={`/account/orders/${o._id}`} className={buttonVariants()}>
                          {t("Track order")}
                        </Link>
                        <CancelOrderButton orderId={o._id} orderNumber={o.orderNumber} />
                      </>
                    ) : (
                      <>
                        <Link href={`/product/${first.slug}`} className={buttonVariants()}>
                          {t("Buy it again")}
                        </Link>
                        <Link
                          href={o.status === "delivered" ? `/product/${first.slug}#reviews` : `/account/orders/${o._id}`}
                          className={buttonVariants({ variant: "subtle" })}
                        >
                          {o.status === "delivered" ? t("Write a review") : t("View order details")}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}

        {data.totalPages > 1 && (
          <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: String(p) })} />
        )}
      </div>
    </Container>
  );
}
