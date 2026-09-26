"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENCY } from "@/constants/currency";
import { i18n } from "@/i18n/i18n-confige";
import { usePathname, useRouter } from "@/i18n/routing";
import useMounted from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";

type Currency = "EUR" | "USD" | "EGP";

export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (locale: string) => {
    const qs = searchParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale });
  };
}

// "English · USD" trigger used in the top bar; `variant="pill"` in the footer.
export default function LocaleCurrencyMenu({
  variant = "bar",
  only,
}: {
  variant?: "bar" | "pill";
  only?: "language" | "currency";
}) {
  const locale = useLocale();
  const t = useTranslations("Header");
  const tc = useTranslations("Currency");
  const { currency, setCurrency } = useStore();
  const mounted = useMounted();
  const switchLocale = useSwitchLocale();
  const shownCurrency = mounted ? currency : "USD";
  const localeName = i18n.locales.find((l) => l.code === locale)?.name;

  const showLanguage = only !== "currency";
  const showCurrency = only !== "language";
  const label =
    only === "language"
      ? localeName
      : only === "currency"
        ? `${shownCurrency}`
        : `${localeName} · ${shownCurrency}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1.5 font-medium",
          variant === "bar"
            ? "h-9 rounded-sm px-1 text-[13px] text-inverse-foreground hover:text-inverse-foreground/80"
            : "h-10 rounded-full border border-inverse-border px-3.5 text-[13px] text-inverse-foreground hover:bg-inverse-raised"
        )}
      >
        {only !== "currency" && <Globe className="size-[15px]" aria-hidden />}
        <span>{label}</span>
        {variant === "bar" && <ChevronDown className="size-3.5" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {showLanguage && (
          <>
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {t("Language")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={locale} onValueChange={switchLocale}>
              {i18n.locales.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code}>
                  {l.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        {showLanguage && showCurrency && <DropdownMenuSeparator />}
        {showCurrency && (
          <>
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {t("Currency label")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={shownCurrency}
              onValueChange={(v) => setCurrency(v as Currency)}
            >
              {CURRENCY.map((c) => (
                <DropdownMenuRadioItem key={c} value={c}>
                  <span className="flex-1">{tc(c)}</span>
                  <span className="text-xs text-muted-foreground">{c}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
