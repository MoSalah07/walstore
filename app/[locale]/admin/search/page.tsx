import Image from "next/image";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getAdminOrders } from "@/actions/admin-order.action";
import { getAdminProducts } from "@/actions/admin-product.action";
import { getAdminUsers } from "@/actions/admin-user.action";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/badge";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("nav.search") };
}

// One box, three result groups: orders, products, users.
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [t, to] = await Promise.all([getTranslations("AdminSearch"), getTranslations("Orders")]);
  const [orders, products, users] = query
    ? await Promise.all([
        getAdminOrders({ q: query, period: "all", limit: 5 }),
        getAdminProducts({ q: query, limit: 5 }),
        getAdminUsers({ q: query, limit: 5 }),
      ])
    : [null, null, null];
  const card = cardVariants({ flush: true, className: "overflow-hidden" });
  const none = query && !orders?.total && !products?.total && !users?.total;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]">{t("Search")}</h1>
      <form role="search" className="flex h-12 max-w-2xl items-center gap-2 rounded-md border-[1.5px] border-input bg-card px-4 focus-within:border-foreground">
        <Search className="size-5 text-muted-foreground" aria-hidden />
        <label htmlFor="as-q" className="sr-only">{t("Search")}</label>
        <input id="as-q" name="q" type="search" defaultValue={query} autoFocus placeholder={t("Placeholder")} className="min-w-0 flex-1 bg-transparent text-base outline-none" />
      </form>
      {!query && <p className="text-foreground-secondary">{t("Hint")}</p>}
      {none && <p className="text-foreground-secondary">{t("No results", { q: query })}</p>}

      {orders && orders.total > 0 && (
        <section className={card}>
          <h2 className="flex items-center justify-between border-b border-border-soft px-5 py-3.5 text-base font-bold">
            {t("Orders")} <span className="text-sm font-normal text-muted-foreground">{orders.total}</span>
          </h2>
          <ul>
            {orders.orders.map((o) => (
              <li key={o._id} className="border-b border-border-soft last:border-0">
                <Link href={`/admin/orders/${o._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-background-subtle">
                  <span className="font-bold" dir="ltr">#{o.orderNumber}</span>
                  <span className="flex-1 truncate text-sm text-foreground-secondary">{o.customer?.name ?? o.shippingAddress.fullName}</span>
                  <StatusPill status={o.status} size="sm">{to(`status.${o.status}`)}</StatusPill>
                  <span className="w-24 text-end font-bold tabular-nums">{formatMoney(o.totalPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {orders.total > 5 && <Link href={`/admin/orders?period=all&q=${encodeURIComponent(query)}`} className="block px-5 py-3 text-sm font-bold hover:underline">{t("See all orders")}</Link>}
        </section>
      )}

      {products && products.total > 0 && (
        <section className={card}>
          <h2 className="flex items-center justify-between border-b border-border-soft px-5 py-3.5 text-base font-bold">
            {t("Products")} <span className="text-sm font-normal text-muted-foreground">{products.total}</span>
          </h2>
          <ul>
            {products.products.map((p) => (
              <li key={p._id} className="border-b border-border-soft last:border-0">
                <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-background-subtle">
                  <span className="relative size-10 shrink-0 rounded-sm bg-media">
                    {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-contain p-1 mix-blend-multiply" />}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <span className="font-bold tabular-nums">{formatMoney(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {products.total > 5 && <Link href={`/admin/products?q=${encodeURIComponent(query)}`} className="block px-5 py-3 text-sm font-bold hover:underline">{t("See all products")}</Link>}
        </section>
      )}

      {users && users.total > 0 && (
        <section className={card}>
          <h2 className="flex items-center justify-between border-b border-border-soft px-5 py-3.5 text-base font-bold">
            {t("Users")} <span className="text-sm font-normal text-muted-foreground">{users.total}</span>
          </h2>
          <ul>
            {users.users.map((u) => (
              <li key={u._id} className="border-b border-border-soft last:border-0">
                <Link href={`/admin/users/${u._id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-background-subtle">
                  <Avatar name={u.name} size="sm" tone="soft" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">{u.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {users.total > 5 && <Link href={`/admin/users?q=${encodeURIComponent(query)}`} className="block px-5 py-3 text-sm font-bold hover:underline">{t("See all users")}</Link>}
        </section>
      )}
    </div>
  );
}
