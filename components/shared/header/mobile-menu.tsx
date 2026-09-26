"use client";

import { useState } from "react";
import { ChevronRight, LogOut, Menu } from "lucide-react";

import { SignOut } from "@/actions/user.action";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { LogoMark } from "@/components/shared/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CURRENCY } from "@/constants/currency";
import { NAV_LINKS } from "@/constants";
import { i18n } from "@/i18n/i18n-confige";
import { Link } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { useSwitchLocale } from "./locale-currency-menu";

type Currency = "EUR" | "USD" | "EGP";

// Drawer from the start edge on phones and tablets.
export default function MobileMenu({
  categories,
  userName,
}: {
  categories: string[];
  userName?: string | null;
}) {
  const t = useTranslations("Header");
  const tc = useTranslations("Categories");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { currency, setCurrency } = useStore();
  const { theme, setTheme } = useTheme();
  const switchLocale = useSwitchLocale();
  const close = () => setOpen(false);

  const row =
    "flex h-12 items-center justify-between rounded-md px-3 text-[15px] font-medium text-foreground transition-colors duration-fast hover:bg-sunken";
  const chip = (active: boolean) =>
    cn(
      "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors duration-fast",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-input bg-card text-foreground hover:border-foreground"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("Open menu")}
          className="-ms-2.5 flex size-11 items-center justify-center rounded-full text-foreground hover:bg-sunken"
        >
          <Menu className="size-[22px]" />
        </button>
      </SheetTrigger>
      <SheetContent side="start" closeLabel={t("Close")} className="gap-5 overflow-y-auto p-5">
        <SheetHeader className="flex-row items-center gap-3">
          <LogoMark size="sm" />
          <div className="flex flex-col">
            <SheetTitle className="text-base">
              {userName ? t("Hello name", { name: userName.split(" ")[0] }) : t("Menu")}
            </SheetTitle>
            <SheetDescription className="text-xs">{t("Help & Settings")}</SheetDescription>
          </div>
        </SheetHeader>

        {!userName && (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/sign-in" onClick={close} className={buttonVariants({ size: "sm" })}>
              {t("Sign in")}
            </Link>
            <Link
              href="/sign-up"
              onClick={close}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {t("Sign up")}
            </Link>
          </div>
        )}

        <section className="flex flex-col">
          <h2 className="type-overline mb-1 px-3 text-muted-foreground">{t("Shop")}</h2>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={close}
              className={cn(row, l.deal && "font-bold text-deal")}
            >
              {t(l.key)}
              <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden />
            </Link>
          ))}
          {categories.map((c) => (
            <Link
              key={c}
              href={`/search?category=${encodeURIComponent(c)}`}
              onClick={close}
              className={row}
            >
              {tc.has(c) ? tc(c) : c}
              <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden />
            </Link>
          ))}
        </section>

        <section className="flex flex-col border-t border-border-soft pt-4">
          <h2 className="type-overline mb-1 px-3 text-muted-foreground">{t("Help & Settings")}</h2>
          <Link href="/account" onClick={close} className={row}>
            {t("Your account")}
          </Link>
          <Link href="/account/orders" onClick={close} className={row}>
            {t("Your orders")}
          </Link>
          <Link href="/page/help" onClick={close} className={row}>
            {t("Customer Service")}
          </Link>
        </section>

        <section className="flex flex-col gap-4 border-t border-border-soft px-3 pt-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t("Language")}</span>
            <div className="flex flex-wrap gap-2">
              {i18n.locales.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  aria-pressed={l.code === locale}
                  onClick={() => switchLocale(l.code)}
                  className={chip(l.code === locale)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t("Currency label")}</span>
            <div className="flex flex-wrap gap-2">
              {CURRENCY.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={mounted && c === currency}
                  onClick={() => setCurrency(c as Currency)}
                  className={chip(mounted && c === currency)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t("Theme")}</span>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark", "system"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mounted && theme === m}
                  onClick={() => setTheme(m)}
                  className={chip(mounted && theme === m)}
                >
                  {t(m === "light" ? "Light" : m === "dark" ? "Dark" : "System")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {userName && (
          <form action={SignOut} className="border-t border-border-soft pt-3">
            <Button type="submit" variant="ghost" className="w-full justify-start text-destructive">
              <LogOut aria-hidden />
              {t("Sign out")}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
