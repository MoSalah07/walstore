"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { useSwitchLocale } from "@/components/shared/header/locale-currency-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CURRENCY } from "@/constants/currency";
import { i18n } from "@/i18n/i18n-confige";
import useMounted from "@/hooks/use-mounted";
import { useStore } from "@/store";

const select =
  "h-[46px] w-full rounded-md border-[1.5px] border-input bg-card px-3 text-[15px] text-foreground outline-none focus-visible:border-foreground";

export default function Preferences() {
  const t = useTranslations("Account");
  const tc = useTranslations("Currency");
  const locale = useLocale();
  const mounted = useMounted();
  const switchLocale = useSwitchLocale();
  const { currency, setCurrency } = useStore();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <section className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5 md:p-7">
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
      <div className="flex items-center justify-between">
        <Label htmlFor="pref-dark" className="text-[15px] font-normal">
          {t("Dark mode")}
        </Label>
        <Switch
          id="pref-dark"
          checked={mounted && resolvedTheme === "dark"}
          onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        />
      </div>
    </section>
  );
}
