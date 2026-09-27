"use client";

import { Heart, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { SignOut } from "@/actions/user.action";
import { Avatar } from "@/components/ui/avatar";
import { cardVariants } from "@/components/ui/card";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Side nav on desktop; a scrollable pill row on phones.
export default function AccountNav({ name }: { name: string }) {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const items = [
    { href: "/account/orders", label: t("Your orders"), icon: Package, on: pathname.startsWith("/account/orders") },
    { href: "/account", label: t("Profile & security"), icon: UserRound, on: pathname === "/account" },
    { href: "/account#addresses", label: t("Addresses"), icon: MapPin, on: false },
    { href: "/account/wishlist", label: t("Wishlist"), icon: Heart, on: pathname.startsWith("/account/wishlist") },
  ];

  return (
    <>
      <nav aria-label={t("Account")} className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none lg:hidden">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={i.on ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold",
              i.on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"
            )}
          >
            {i.label}
          </Link>
        ))}
      </nav>
      <nav
        aria-label={t("Account")}
        className={cardVariants({ className: "hidden w-[260px] shrink-0 flex-col gap-1 lg:sticky lg:top-44 lg:flex" })}
      >
        <div className="mb-2 flex items-center gap-3 border-b border-border px-2 pb-4 pt-1">
          <Avatar name={name} size="md" className="size-11" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[13px] text-foreground-secondary">{t("Hello")}</span>
            <span className="truncate font-bold">{name}</span>
          </span>
        </div>
        {items.map(({ href, label, icon: Icon, on }) => (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors duration-fast",
              on ? "bg-secondary font-bold text-primary-hover dark:text-foreground" : "font-medium hover:bg-background-subtle"
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </Link>
        ))}
        <form action={SignOut}>
          <button
            type="submit"
            className="flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-destructive transition-colors duration-fast hover:bg-error-bg"
          >
            <LogOut className="size-[18px]" aria-hidden />
            {t("Sign out")}
          </button>
        </form>
      </nav>
    </>
  );
}
