"use client";

import { useLocale, useTranslations } from "next-intl";

import { useSwitchLocale } from "@/components/shared/header/locale-currency-menu";
import BrandPicker from "@/components/shared/theme/brand-picker";
import ModePicker from "@/components/shared/theme/mode-picker";
import { Label } from "@/components/ui/label";
import { cardVariants } from "@/components/ui/card";
import { CURRENCY } from "@/constants/currency";
import { i18n } from "@/i18n/i18n-confige";
import useMounted from "@/hooks/use-mounted";
import { useStore } from "@/store";

const select =
  "h-10 w-full rounded-[10px] border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-foreground";

export default function Preferences() {
  const t = useTranslations("Account");
  const tc = useTranslations("Currency");
  const tt = useTranslations("Theme");
  const locale = useLocale();
  const mounted = useMounted();
  const switchLocale = useSwitchLocale();
  const { currency, setCurrency } = useStore();

  return (
    <section className={cardVariants({ size: "lg", className: "flex flex-col gap-3.5" })}>
      <h2 className="text-xl font-bold">{t("Preferences")}</h2>
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-lang">{t("Language")}</Label>
          <select id="pref-lang" value={locale} onChange={(e) => switchLocale(e.target.value)} className={select}>
            {i18n.locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-cur">{t("Currency")}</Label>
          <select
            id="pref-cur"
            value={mounted ? currency : "USD"}
            onChange={(e) => setCurrency(e.target.value as "USD" | "EUR" | "EGP")}
            className={select}
          >
            {CURRENCY.map((c) => (
              <option key={c} value={c}>
                {tc(c)} ({c})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{tt("Mode")}</span>
        <ModePicker />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{tt("Color")}</span>
        <BrandPicker />
      </div>
    </section>
  );
}
