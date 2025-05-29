"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { i18n } from "@/i18n/i18n-confige";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { CURRENCY } from "@/constants/currency";
import { useStore } from "@/store";

export default function MainSwitcher() {
  const { locales } = i18n;
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Header");
  const { currency, setCurrency } = useStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switcher Languages and Currency"
        className="border-none focus:outline-none outline-none"
      >
        <div className="flex-center gap-1 border border-white h-10 w-14 rounded-lg text-white">
          <span className="mt-1 text-base">
            {" "}
            {locales.find((l) => l.code === locale)?.icon}
          </span>
          {locale.toUpperCase().slice(0, 2)}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t("Languages")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale}>
          {locales.map((c) => (
            <DropdownMenuRadioItem key={c.name} value={c.code}>
              <Link
                className="flex-center gap-1.5 text-sm font-semibold"
                href={pathname}
                locale={c.code}
              >
                <span className="text-base font-normal">{c.icon}</span>
                {c.name}
              </Link>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuLabel>{t("Currency")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currency}>
          {CURRENCY.map((c, idx) => (
            <DropdownMenuRadioItem
              onClick={() => setCurrency(c as "EUR" | "USD" | "EGP")}
              key={idx}
              value={c}
            >
              <span className="text-base font-normal">{c}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
