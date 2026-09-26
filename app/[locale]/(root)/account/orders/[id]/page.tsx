import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getOrderById } from "@/actions/order.action";
import Container from "@/components/shared/container";
import CancelOrderButton from "@/components/shared/order/cancel-order-button";
import OrderLines from "@/components/shared/order/order-lines";
import OrderProgress from "@/components/shared/order/order-progress";
import Price from "@/components/shared/price";
import { StatusPill } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { formatDate, ltr } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getTranslations("Account")]);
  const order = await getOrderById(id);
  return { title: order ? t("Order n", { number: ltr(order.orderNumber) }) : t("Your orders") };
}

export default async function AccountOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, t, to, tc, locale] = await Promise.all([
    getOrderById(id),
    getTranslations("Account"),
    getTranslations("Orders"),
    getTranslations("Checkout"),
    getLocale(),
  ]);
  if (!order) notFound();
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const region = new Intl.DisplayNames([locale], { type: "region" });
  const a = order.shippingAddress;
  const canCancel = ["unpaid", "processing"].includes(order.status);

  const sub = [
    t("Placed on", { date: formatDate(order.createdAt, locale) }),
    order.deliveredAt && t("Delivered on", { date: formatDate(order.deliveredAt, locale) }),
    order.cancelledAt && t("Cancelled on", { date: formatDate(order.cancelledAt, locale) }),
  ].filter(Boolean);

  return (
    <Container className="flex flex-col gap-6 pb-16 pt-6 md:pb-20 md:pt-8">
      <Breadcrumb
        label={t("Breadcrumb")}
        items={[
          { label: t("Your account"), href: "/account" },
          { label: t("Your orders"), href: "/account/orders" },
          { label: ltr(`#${order.orderNumber}`) },
        ]}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="type-h1 text-[28px] leading-8 md:text-[40px] md:leading-10">
              {t("Order n", { number: ltr(order.orderNumber) })}
            </h1>
            <StatusPill status={order.status} className="text-[13px]">
              {to(`status.${order.status}`)}
            </StatusPill>
          </div>
          <span className="text-[15px] text-foreground-secondary">{sub.join(" · ")}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {canCancel && <CancelOrderButton orderId={order._id} orderNumber={order.orderNumber} />}
          <Link href="/page/returns" className={buttonVariants({ variant: "outline" })}>
            {t("Return or replace")}
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 md:p-7">
        <OrderProgress order={order} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="border-b border-border-soft px-5 py-4 text-lg font-bold md:px-6">{t("Items")}</h2>
          <OrderLines
            items={order.items}
            actions={(l) => (
              <span className="hidden gap-2 md:flex">
                <Link href={`/product/${l.slug}`} className={buttonVariants({ size: "sm" })}>
                  {t("Buy it again")}
                </Link>
                {order.status === "delivered" && (
                  <Link href={`/product/${l.slug}#reviews`} className={buttonVariants({ size: "sm", variant: "subtle" })}>
                    {t("Write a review")}
                  </Link>
                )}
              </span>
            )}
          />
        </section>
        <aside className="flex flex-col gap-5">
          <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-6 text-[15px]">
            <h2 className="mb-1 text-lg font-bold">{t("Payment summary")}</h2>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">{tc("Items n", { count })}</span>
              <Price amount={order.itemsPrice} />
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">{tc("Shipping")}</span>
              {order.shippingPrice === 0 ? <span className="text-success-fg">{tc("FREE")}</span> : <Price amount={order.shippingPrice} />}
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-secondary">{tc("Tax")}</span>
              <Price amount={order.taxPrice} />
            </div>
            <div className="flex justify-between border-t border-border-soft pt-3 font-bold">
              <span>
                {order.isPaid ? t("Paid") : t("To pay")} · {to(`payment.${order.paymentMethod}`)}
              </span>
              <Price amount={order.totalPrice} />
            </div>
          </section>
          <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6 text-[15px] leading-relaxed">
            <h2 className="mb-1 text-lg font-bold">{order.status === "delivered" ? t("Delivered to") : t("Shipping to")}</h2>
            <span>
              {a.fullName}
              <br />
              {a.street}
              <br />
              {a.city}, {a.province} {a.postalCode}, {region.of(a.country) ?? a.country}
              <br />
              <span dir="ltr">{a.phone}</span>
            </span>
          </section>
          <Link
            href="/page/help"
            className="flex items-center justify-between rounded-xl bg-secondary px-6 py-[18px] font-bold text-primary-hover dark:text-foreground"
          >
            {t("Problem with order")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </aside>
      </div>
    </Container>
  );
}
