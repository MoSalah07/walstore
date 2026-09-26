import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getOrderById } from "@/actions/order.action";
import Container from "@/components/shared/container";
import OrderLines from "@/components/shared/order/order-lines";
import OrderProgress from "@/components/shared/order/order-progress";
import Price from "@/components/shared/price";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { requireUser } from "@/lib/auth-guard";

export async function generateMetadata() {
  const t = await getTranslations("Checkout");
  return { title: t("Order placed") };
}

export default async function OrderConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/checkout/confirmed/${id}`);
  const [order, t, to, locale] = await Promise.all([
    getOrderById(id),
    getTranslations("Checkout"),
    getTranslations("Orders"),
    getLocale(),
  ]);
  if (!order) notFound();
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const region = new Intl.DisplayNames([locale], { type: "region" });
  const a = order.shippingAddress;

  return (
    <Container className="flex max-w-[880px] flex-col gap-6 pb-16 pt-8 md:pb-20 md:pt-12">
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center md:px-12 md:py-14">
        <span className="flex size-16 items-center justify-center rounded-full bg-success text-white motion-safe:animate-fade-up">
          <Check className="size-8" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="type-h1 text-[28px] leading-9 md:text-[40px] md:leading-[44px]">{t("Thank you")}</h1>
        <p className="max-w-lg text-[15px] text-foreground-secondary md:text-base">
          {t.rich("Order number line", {
            number: () => <span dir="ltr" className="font-bold text-foreground">#{order.orderNumber}</span>,
          })}
        </p>
        <div className="mt-4 w-full max-w-xl text-start">
          <OrderProgress order={order} compact />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="border-b border-border-soft px-5 py-4 text-lg font-bold md:px-6">{t("Order details")}</h2>
        <OrderLines items={order.items} />
        <div className="grid gap-5 border-t border-border bg-background-subtle px-5 py-5 text-sm md:grid-cols-3 md:px-6">
          <div className="flex flex-col gap-1">
            <span className="type-overline text-muted-foreground">{t("Ship to")}</span>
            <span className="font-semibold">{a.fullName}</span>
            <span className="text-foreground-secondary">
              {a.street}, {a.city}, {region.of(a.country) ?? a.country}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="type-overline text-muted-foreground">{t("Payment")}</span>
            <span className="font-semibold">{to(`payment.${order.paymentMethod}`)}</span>
            <span className="text-foreground-secondary">
              {t(order.shippingMethod === "express" ? "Express shipping" : "Standard shipping")} ·{" "}
              {order.shippingPrice === 0 ? t("FREE") : <Price amount={order.shippingPrice} />}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="type-overline text-muted-foreground">{t("Order total")}</span>
            <Price amount={order.totalPrice} className="font-display text-2xl font-extrabold" />
            <span className="text-foreground-secondary">{t("Items n", { count })}</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/account/orders/${order._id}`} className={buttonVariants({ size: "lg" })}>
          {t("View your order")}
        </Link>
        <Link href="/" className={buttonVariants({ size: "lg", variant: "outline" })}>
          {t("Continue shopping")}
        </Link>
      </div>
    </Container>
  );
}
