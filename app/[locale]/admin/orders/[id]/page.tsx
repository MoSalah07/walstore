import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, CircleDot, MessageSquare, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAdminOrder } from "@/actions/admin-order.action";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusPill } from "@/components/ui/badge";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatDate, formatDateTime, formatMoney, ltr, regionNames } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NoteForm, OrderActions } from "./order-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminOrder(id);
  return { title: data ? `#${data.order.orderNumber}` : "404" };
}

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, t, to, tc, locale] = await Promise.all([
    getAdminOrder(id),
    getTranslations("Admin"),
    getTranslations("Orders"),
    getTranslations("Checkout"),
    getLocale(),
  ]);
  if (!data) notFound();
  const { order, customer, orderCount } = data;
  const region = regionNames(locale);
  const a = order.shippingAddress;
  const count = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/orders" className="flex items-center gap-1.5 self-start text-sm font-semibold text-foreground-secondary hover:text-foreground print:hidden">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("All orders")}
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] md:text-[30px]" dir="ltr">#{order.orderNumber}</h1>
            <StatusPill status={order.status}>{to(`status.${order.status}`)}</StatusPill>
            <Badge variant={order.isPaid ? "success" : "warning"}>{order.isPaid ? t("Paid") : t("Not paid")}</Badge>
          </div>
          <span className="text-sm text-foreground-secondary">
            {t("Placed at", { date: formatDateTime(order.createdAt, locale) })} · {to(`payment.${order.paymentMethod}`)}
          </span>
        </div>
        <OrderActions id={order._id} status={order.status} isPaid={order.isPaid} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <section className={cardVariants({ flush: true, className: "overflow-hidden" })}>
            <h2 className="border-b border-border-soft px-5 py-4 text-base font-bold">
              {t("Items")} <span className="font-normal text-muted-foreground">· {count}</span>
            </h2>
            <ul>
              {order.items.map((l, i) => (
                <li key={i} className="grid grid-cols-[48px_1fr_auto] items-center gap-3.5 border-b border-border-soft px-5 py-3 md:grid-cols-[48px_1fr_90px_100px]">
                  <span className="relative flex size-12 items-center justify-center rounded-sm bg-media">
                    <span className="relative size-[80%]">
                      <Image src={l.image} alt="" fill sizes="48px" className="object-contain mix-blend-multiply" />
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <Link href={`/admin/products/${l.product}`} className="line-clamp-1 text-sm font-semibold hover:underline">{l.name}</Link>
                    <span className="text-xs text-muted-foreground">{[l.color, l.size, `× ${l.quantity}`].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="hidden text-end text-sm text-foreground-secondary tabular-nums md:block">{formatMoney(l.price)}</span>
                  <span className="text-end text-sm font-bold tabular-nums">{formatMoney(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-2 bg-background-subtle px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-foreground-secondary">{t("Subtotal")}</dt><dd className="tabular-nums">{formatMoney(order.itemsPrice)}</dd></div>
              {order.discountPrice > 0 && (
                <div className="flex justify-between">
                  <dt className="text-foreground-secondary">
                    {tc("Discount")} {order.promo && <span dir="ltr" className="font-semibold">({order.promo.code})</span>}
                  </dt>
                  <dd className="font-semibold tabular-nums text-deal">−{formatMoney(order.discountPrice)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">{tc("Shipping")} · {tc(order.shippingMethod === "express" ? "Express shipping" : "Standard shipping")}</dt>
                <dd className="tabular-nums">{order.shippingPrice === 0 ? tc("FREE") : formatMoney(order.shippingPrice)}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-foreground-secondary">{tc("Tax")}</dt><dd className="tabular-nums">{formatMoney(order.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>{order.isPaid ? t("Total paid") : t("Total due")}</dt>
                <dd className="tabular-nums">{formatMoney(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          <section className={cardVariants({ className: "flex flex-col gap-4 print:hidden" })}>
            <h2 className="text-base font-bold">{t("Timeline")}</h2>
            <ol className="flex flex-col">
              {[...order.history].reverse().map((h, i, arr) => {
                const Icon = h.status === "note" ? MessageSquare : h.status === "cancelled" ? X : i === 0 ? CircleDot : Check;
                return (
                  <li key={i} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full",
                          h.status === "cancelled" ? "bg-error-bg text-error-fg" : h.status === "note" ? "bg-sunken text-foreground-secondary" : "bg-success-bg text-success-fg"
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                      {i < arr.length - 1 && <span className="w-px flex-1 bg-border" />}
                    </span>
                    <span className="flex flex-col gap-0.5 pb-4">
                      <span className="text-sm font-semibold">
                        {h.status === "note" ? t("Note") : h.status === "paid" ? t("Paid") : h.status === "processing" && i === arr.length - 1 ? t("Order placed") : to(`status.${h.status}`)}
                      </span>
                      {h.note && <span className="text-sm text-foreground-secondary">{h.note}</span>}
                      <span className="text-xs text-muted-foreground">{formatDateTime(h.at, locale)}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <NoteForm id={order._id} />
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className={cardVariants({ className: "flex flex-col gap-3" })}>
            <h2 className="text-base font-bold">{t("Customer")}</h2>
            {customer ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={customer.name} />
                  <span className="flex min-w-0 flex-col">
                    <Link href={`/admin/users/${customer._id}`} className="truncate font-semibold hover:underline">{customer.name}</Link>
                    <span className="truncate text-[13px] text-muted-foreground">{customer.email}</span>
                  </span>
                </div>
                <span className="text-[13px] text-foreground-secondary">
                  {t("customer summary", { count: orderCount, date: formatDate(customer.createdAt, locale, { month: "short", year: "numeric" }) })}
                </span>
              </>
            ) : (
              <span className="text-sm text-foreground-secondary">{t("Deleted user")}</span>
            )}
          </section>
          <section className={cardVariants({ className: "flex flex-col gap-2 text-sm leading-relaxed" })}>
            <h2 className="mb-1 text-base font-bold">{t("Shipping address")}</h2>
            <span>
              {a.fullName}
              <br />
              {a.street}
              <br />
              {a.city}, {a.province} {a.postalCode}
              <br />
              {region(a.country)}
            </span>
            <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="font-semibold hover:underline" dir="ltr">{a.phone}</a>
          </section>
          <section className={cardVariants({ className: "flex flex-col gap-2 text-sm" })}>
            <h2 className="mb-1 text-base font-bold">{t("Payment")}</h2>
            <span className="flex items-center justify-between">
              <span>{to(`payment.${order.paymentMethod}`)}</span>
              <Badge variant={order.isPaid ? "success" : "warning"} size="sm">{order.isPaid ? t("Paid") : t("Not paid")}</Badge>
            </span>
            {order.paidAt && <span className="text-xs text-muted-foreground">{t("Paid at", { date: formatDateTime(order.paidAt, locale) })}</span>}
            {!order.isPaid && order.paymentMethod === "cod" && order.status !== "cancelled" && (
              <span className="text-xs text-muted-foreground">{t("COD collect", { total: ltr(formatMoney(order.totalPrice)) })}</span>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
