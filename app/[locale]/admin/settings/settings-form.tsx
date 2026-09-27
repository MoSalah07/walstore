"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { saveSettings } from "@/actions/admin-system.action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cardVariants } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Values = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingMin: string;
  standardShipping: string;
  expressShipping: string;
  taxPercent: string;
};

const SECTIONS = ["store", "shipping", "locale", "profile"] as const;

export default function SettingsForm({ initial, languages, currencies }: { initial: Values; languages: { code: string; name: string }[]; currencies: string[] }) {
  const t = useTranslations("AdminSettings");
  const tc = useTranslations("Currency");
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const card = cardVariants({ size: "lg", className: "flex scroll-mt-40 flex-col gap-4" });

  const money = (k: keyof Values, label: string, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`st-${k}`}>{label}</Label>
      <div className={cn("flex h-9 items-center rounded-[10px] border bg-card focus-within:border-foreground", errors[k] ? "border-destructive" : "border-input")}>
        <span className="ps-3 text-sm text-muted-foreground">$</span>
        <input id={`st-${k}`} inputMode="decimal" dir="ltr" value={v[k]} onChange={set(k)} className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm tabular-nums outline-none" />
      </div>
      {(errors[k] || hint) && <p className={cn("text-[13px]", errors[k] ? "font-semibold text-destructive" : "text-foreground-secondary")}>{errors[k] ? t("Invalid number") : hint}</p>}
    </div>
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label={t("Sections")} className="flex gap-1 overflow-x-auto scrollbar-none lg:sticky lg:top-24 lg:flex-col">
        {SECTIONS.map((s) => (
          <a key={s} href={`#${s}`} className="flex h-10 shrink-0 items-center rounded-[10px] px-3 text-sm font-medium hover:bg-card">
            {t(`section.${s}`)}
          </a>
        ))}
      </nav>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saveSettings(v);
            if (r.ok) {
              setErrors({});
              toast.success(t("Saved"));
              router.refresh();
            } else setErrors(r.fields ?? {});
          });
        }}
      >
        {Object.keys(errors).length > 0 && <Alert variant="error">{t("Fix errors")}</Alert>}

        <section id="store" className={card}>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold">{t("section.store")}</h2>
            <span className="text-[13px] text-foreground-secondary">{t("Store help")}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-name">{t("Store name")}</Label>
              <Input id="st-name" size="sm" value={v.storeName} onChange={set("storeName")} aria-invalid={!!errors.storeName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-mail">{t("Support email")}</Label>
              <Input id="st-mail" size="sm" type="email" dir="ltr" value={v.supportEmail} onChange={set("supportEmail")} placeholder="support@your-domain.com" aria-invalid={!!errors.supportEmail} />
              {errors.supportEmail && <p className="text-[13px] font-semibold text-destructive">{t("Invalid email")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-phone">{t("Support phone")}</Label>
              <Input id="st-phone" size="sm" type="tel" dir="ltr" value={v.supportPhone} onChange={set("supportPhone")} />
            </div>
          </div>
        </section>

        <section id="shipping" className={card}>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold">{t("section.shipping")}</h2>
            <span className="text-[13px] text-foreground-secondary">{t("Shipping help")}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {money("freeShippingMin", t("Free shipping from"), t("Free help"))}
            {money("standardShipping", t("Standard price"))}
            {money("expressShipping", t("Express price"))}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="st-tax">{t("Tax rate")}</Label>
              <div className={cn("flex h-9 items-center rounded-[10px] border bg-card focus-within:border-foreground", errors.taxPercent ? "border-destructive" : "border-input")}>
                <input id="st-tax" inputMode="decimal" dir="ltr" value={v.taxPercent} onChange={set("taxPercent")} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none" />
                <span className="pe-3 text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-[13px] text-foreground-secondary">{t("Tax help")}</p>
            </div>
          </div>
        </section>

        <section id="locale" className={card}>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold">{t("section.locale")}</h2>
            <span className="text-[13px] text-foreground-secondary">{t("Locale help")}</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t("Languages")}</span>
              {languages.map((l, i) => (
                <span key={l.code} className="flex items-center justify-between rounded-md border border-border px-3.5 py-2.5 text-sm">
                  <span lang={l.code}>{l.name}</span>
                  {i === 0 ? <Badge size="sm">{t("Default")}</Badge> : l.code === "ar" && <Badge variant="muted" size="sm">{t("RTL")}</Badge>}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t("Currencies")}</span>
              {currencies.map((c, i) => (
                <span key={c} className="flex items-center justify-between rounded-md border border-border px-3.5 py-2.5 text-sm">
                  <span>{c} · {tc(c)}</span>
                  {i === 0 && <Badge size="sm">{t("Base")}</Badge>}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="profile" className={card}>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold">{t("section.profile")}</h2>
            <span className="text-[13px] text-foreground-secondary">{t("Profile help")}</span>
          </div>
          <Link href="/account" className="self-start text-sm font-bold underline-offset-4 hover:underline">{t("Open account")}</Link>
        </section>

        <div className={cardVariants({ variant: "elevated", size: "sm", className: "sticky bottom-20 z-10 flex justify-end gap-2 bg-card/95 p-3 backdrop-blur md:bottom-4" })}>
          <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => { setV(initial); setErrors({}); }}>{t("Cancel")}</Button>
          <Button type="submit" loading={pending} disabled={!dirty}>{t("Save settings")}</Button>
        </div>
      </form>
    </div>
  );
}
