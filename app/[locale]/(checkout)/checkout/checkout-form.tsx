"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CreditCard, Lock, ShoppingBag, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createOrder } from "@/actions/order.action";
import Price from "@/components/shared/price";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { ShippingAddressSchema } from "@/interfaces/validator/validator";
import { PricingConfig, ShippingMethod, calcPrices } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { IUserAddress } from "@/models/user.model";
import useCartStore from "@/store/use-cart-store";

type Address = z.infer<typeof ShippingAddressSchema>;
const COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "JO", "US", "GB", "DE"];

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold md:text-xl">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
        {n}
      </span>
      {children}
    </h2>
  );
}

function OptionCard({
  checked,
  onSelect,
  disabled,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-md bg-card p-4 text-start transition-colors duration-fast",
        checked ? "border-2 border-primary" : "border-[1.5px] border-input hover:border-foreground",
        disabled && "cursor-not-allowed opacity-55 hover:border-input"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-input",
          checked && "border-2 border-primary"
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</span>
    </button>
  );
}

export default function CheckoutForm({
  pricing,
  addresses,
  defaultName,
}: {
  pricing: PricingConfig;
  addresses: (IUserAddress & { _id?: string })[];
  defaultName: string;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((s) => s.cart.items);
  const clear = useCartStore((s) => s.clear);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [saved, setSaved] = useState<number | "new">(addresses.length ? Math.max(0, addresses.findIndex((a) => a.isDefault)) : "new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  const countryName = useMemo(() => {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return (c: string) => dn.of(c) ?? c;
  }, [locale]);

  const form = useForm<Address>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: { fullName: defaultName, phone: "", street: "", city: "", province: "", postalCode: "", country: "EG" },
  });

  useEffect(() => {
    if (saved !== "new" && addresses[saved]) {
      const a = addresses[saved];
      form.reset({
        fullName: a.fullName,
        phone: a.phone,
        street: a.street,
        city: a.city,
        province: a.province,
        postalCode: a.postalCode,
        country: a.country,
      });
    }
  }, [saved, addresses, form]);

  const p = calcPrices(items, method, pricing);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  if (!mounted) return <Skeleton className="h-[640px] rounded-xl" />;

  if (items.length === 0 && !placed) {
    return (
      <EmptyState
        className="rounded-xl border border-border bg-card"
        icon={<ShoppingBag />}
        title={t("Cart empty")}
        description={t("Cart empty help")}
        actions={
          <Link href="/" className={buttonVariants()}>
            {t("Continue shopping")}
          </Link>
        }
      />
    );
  }

  const onSubmit = async (address: Address) => {
    setSubmitting(true);
    setError(null);
    const res = await createOrder({
      items: items.map((i) => ({ product: i.product, quantity: i.quantity, size: i.size, color: i.color })),
      shippingAddress: address,
      shippingMethod: method,
      paymentMethod: "cod",
      saveAddress: saved === "new" && saveAddress,
    });
    if (res.ok) {
      setPlaced(true);
      clear();
      router.replace(`/checkout/confirmed/${res.orderId}`);
      return;
    }
    setSubmitting(false);
    setError(
      res.error === "stock"
        ? t("Stock error", { name: res.detail ?? "" })
        : res.error === "unavailable"
          ? t("Unavailable error")
          : res.error === "auth"
            ? t("Auth error")
            : t("Server error")
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const text = (name: keyof Address, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...props} {...field} readOnly={saved !== "new"} className={cn(saved !== "new" && "bg-sunken")} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const placeButton = (
    <Button type="submit" form="checkout-form" size="xl" loading={submitting} className="w-full">
      <Lock aria-hidden />
      {submitting ? t("Placing order") : t("Place your order")}
    </Button>
  );

  return (
    <Form {...form}>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
        <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          {/* 1 Address */}
          <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 md:p-7">
            <SectionTitle n={1}>{t("Shipping address")}</SectionTitle>
            {addresses.length > 0 && (
              <div role="radiogroup" aria-label={t("Saved addresses")} className="grid gap-3 md:grid-cols-2">
                {addresses.map((a, i) => (
                  <OptionCard key={a._id ?? i} checked={saved === i} onSelect={() => setSaved(i)}>
                    <span className="font-bold">{a.fullName}</span>
                    <span className="text-sm text-foreground-secondary">
                      {a.street}, {a.city}, {countryName(a.country)}
                    </span>
                  </OptionCard>
                ))}
                <OptionCard
                  checked={saved === "new"}
                  onSelect={() => {
                    setSaved("new");
                    form.reset({ fullName: defaultName, phone: "", street: "", city: "", province: "", postalCode: "", country: "EG" });
                  }}
                >
                  <span className="font-bold">{t("New address")}</span>
                  <span className="text-sm text-foreground-secondary">{t("New address help")}</span>
                </OptionCard>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {text("fullName", t("Full name"), { autoComplete: "name", placeholder: t("Full name placeholder") })}
              {text("phone", t("Phone number"), { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: t("Phone placeholder") })}
            </div>
            {text("street", t("Street address"), { autoComplete: "street-address", placeholder: t("Street placeholder") })}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {text("city", t("City"), { autoComplete: "address-level2" })}
              {text("province", t("Province"), { autoComplete: "address-level1" })}
              {text("postalCode", t("Postal code"), { autoComplete: "postal-code", inputMode: "numeric" })}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Country")}</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={saved !== "new"}
                        autoComplete="country"
                        className="h-[50px] w-full rounded-md border-[1.5px] border-input bg-card px-3 text-[15px] text-foreground outline-none focus-visible:border-foreground disabled:bg-sunken"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {countryName(c)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {saved === "new" && (
              <label className="flex items-center gap-2.5 text-[15px]">
                <Checkbox checked={saveAddress} onCheckedChange={(v) => setSaveAddress(v === true)} />
                {t("Save address")}
              </label>
            )}
          </section>

          {/* 2 Delivery */}
          <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 md:p-7">
            <SectionTitle n={2}>{t("Delivery")}</SectionTitle>
            <div role="radiogroup" aria-label={t("Delivery speed")} className="grid gap-3 md:grid-cols-2">
              <OptionCard checked={method === "standard"} onSelect={() => setMethod("standard")}>
                <span className="flex justify-between gap-2 font-bold">
                  {t("Standard shipping")}
                  {calcPrices(items, "standard", pricing).shippingPrice === 0 ? (
                    <span className="text-success-fg">{t("FREE")}</span>
                  ) : (
                    <Price amount={pricing.standard} />
                  )}
                </span>
                <span className="text-sm text-foreground-secondary">
                  {p.freeShipping
                    ? t("Qualifies free")
                    : t.rich("Free over", { price: () => <Price amount={pricing.freeShippingMin} whole /> })}
                </span>
              </OptionCard>
              <OptionCard checked={method === "express"} onSelect={() => setMethod("express")}>
                <span className="flex justify-between gap-2 font-bold">
                  {t("Express shipping")}
                  <Price amount={pricing.express} />
                </span>
                <span className="text-sm text-foreground-secondary">{t("Express note")}</span>
              </OptionCard>
            </div>
          </section>

          {/* 3 Payment */}
          <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 md:p-7">
            <SectionTitle n={3}>{t("Payment method")}</SectionTitle>
            <div role="radiogroup" aria-label={t("Payment method")} className="flex flex-col gap-3">
              <OptionCard checked onSelect={() => {}}>
                <span className="flex items-center gap-2 font-bold">
                  <Banknote className="size-[18px]" aria-hidden />
                  {t("Cash on delivery")}
                </span>
                <span className="text-sm text-foreground-secondary">{t("COD note")}</span>
              </OptionCard>
              <OptionCard checked={false} disabled onSelect={() => {}}>
                <span className="flex items-center gap-2 font-bold">
                  <CreditCard className="size-[18px]" aria-hidden />
                  {t("Card")}
                </span>
                <span className="text-sm text-foreground-secondary">{t("Not available yet")}</span>
              </OptionCard>
              <OptionCard checked={false} disabled onSelect={() => {}}>
                <span className="flex items-center gap-2 font-bold">
                  <Wallet className="size-[18px]" aria-hidden />
                  PayPal
                </span>
                <span className="text-sm text-foreground-secondary">{t("Not available yet")}</span>
              </OptionCard>
            </div>
          </section>
        </form>

        {/* Summary */}
        <aside aria-label={t("Order summary")} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 md:p-7 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold md:text-xl">{t("Order summary")}</h2>
          <ul className="flex flex-col gap-4">
            {items.map((i) => (
              <li key={i.clientId} className="flex items-center gap-3.5">
                <span className="relative flex size-16 shrink-0 items-center justify-center rounded-md bg-sunken dark:bg-[#E9ECF1]">
                  <span className="relative size-[80%]">
                    <Image src={i.image} alt="" fill sizes="64px" className="object-contain mix-blend-multiply" />
                  </span>
                  <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                    {i.quantity}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-semibold">{i.name}</span>
                  <span className="text-[13px] text-foreground-secondary">
                    {[i.color, i.size].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <Price amount={i.price * i.quantity} className="text-sm font-bold" />
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-3 border-t border-border pt-5 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">{t("Items n", { count })}</dt>
              <dd><Price amount={p.itemsPrice} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">{t("Shipping")}</dt>
              <dd>{p.shippingPrice === 0 ? <span className="font-semibold text-success-fg">{t("FREE")}</span> : <Price amount={p.shippingPrice} />}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">{t("Tax")}</dt>
              <dd><Price amount={p.taxPrice} /></dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-[17px] font-bold">{t("Order total")}</span>
            <Price amount={p.totalPrice} className="font-display text-[28px] font-extrabold" />
          </div>
          <div className="hidden md:block">{placeButton}</div>
          <p className="text-[13px] leading-relaxed text-foreground-secondary">
            {t.rich("Agree", {
              terms: (c) => <Link href="/page/conditions-of-use" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
              privacy: (c) => <Link href="/page/privacy-policy" className="font-semibold text-foreground underline-offset-4 hover:underline">{c}</Link>,
            })}
          </p>
        </aside>
      </div>

      {/* Phone: total + place order */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3.5 border-t border-border bg-card px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-foreground-secondary">{t("Order total")}</span>
          <Price amount={p.totalPrice} className="font-display text-[22px] font-extrabold" />
        </div>
        <div className="flex-1">{placeButton}</div>
      </div>
    </Form>
  );
}
