"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Plus, Shuffle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { deletePromoCode, savePromoCode, setPromoActive } from "@/actions/admin-promo.action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Form values are strings, as typed; dates are YYYY-MM-DD in store time.
export type PromoFormValues = {
  code: string;
  description: string;
  kind: "percent" | "fixed";
  value: string;
  maxDiscount: string;
  minOrder: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
};

export type PromoRow = PromoFormValues & { _id: string; usedCount: number };

const EMPTY: PromoFormValues = {
  code: "",
  description: "",
  kind: "percent",
  value: "",
  maxDiscount: "",
  minOrder: "0",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "1",
  isActive: true,
};

// No 0/O or 1/I, so codes read back clearly over the phone.
const randomCode = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(8)), (n) => abc[n % abc.length]).join("");
};

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {(error || hint) && (
        <p className={cn("text-[13px]", error ? "font-semibold text-destructive" : "text-foreground-secondary")}>{error ?? hint}</p>
      )}
    </div>
  );
}

function Affixed({ id, value, onChange, prefix, suffix, invalid, placeholder }: { id: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; invalid?: boolean; placeholder?: string }) {
  return (
    <div className={cn("flex h-9 items-center rounded-[10px] border bg-card focus-within:border-foreground", invalid ? "border-destructive" : "border-input")}>
      {prefix && <span className="ps-3 text-sm text-muted-foreground">{prefix}</span>}
      <input
        id={id}
        inputMode="decimal"
        dir="ltr"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none placeholder:text-muted-foreground"
      />
      {suffix && <span className="pe-3 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}

// The sheet's content unmounts when closed, so the form starts fresh on every open.
export function PromoCodeSheet({ promo, open, onOpenChange }: { promo?: PromoRow; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("AdminPromo");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" closeLabel={t("Close")} className="w-[460px] max-w-[92vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{promo ? t("Edit code") : t("New code")}</SheetTitle>
          <SheetDescription>{t("Form help")}</SheetDescription>
        </SheetHeader>
        <PromoForm promo={promo} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function PromoForm({ promo, onDone }: { promo?: PromoRow; onDone: () => void }) {
  const t = useTranslations("AdminPromo");
  const router = useRouter();
  const [f, setF] = useState<PromoFormValues>(promo ?? EMPTY);
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof PromoFormValues>(k: K) => (v: PromoFormValues[K]) => setF((x) => ({ ...x, [k]: v }));
  const err = (k: keyof PromoFormValues, msg = t("Check this field")) => (bad.includes(k) ? msg : undefined);
  const codeLocked = !!promo && promo.usedCount > 0;

  return (
    <>
      <form
        id="promo-form"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await savePromoCode(promo?._id ?? null, f);
            if (r.ok) {
              toast.success(promo ? t("Saved") : t("Created"));
              onDone();
              router.refresh();
              return;
            }
            setBad(r.fields ?? []);
            setError(
              r.error === "code-taken" ? t("Code taken") : r.error === "code-locked" ? t("Code locked") : r.error === "missing" ? t("Missing") : t("Fix errors")
            );
          });
        }}
      >
        {error && <Alert variant="error">{error}</Alert>}

        <Field id="pc-code" label={t("Code")} hint={codeLocked ? t("Code locked") : t("Code help")} error={err("code")}>
          <div className="flex gap-2">
            <Input
              id="pc-code"
              size="sm"
              dir="ltr"
              value={f.code}
              disabled={codeLocked}
              onChange={(e) => set("code")(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={bad.includes("code")}
              className="font-semibold uppercase tracking-wide"
            />
            {!codeLocked && (
              <Button type="button" variant="outline" size="md" onClick={() => set("code")(randomCode())}>
                <Shuffle aria-hidden />
                {t("Generate")}
              </Button>
            )}
          </div>
        </Field>

        <Field id="pc-desc" label={t("Description")} hint={t("Description help")} error={err("description")}>
          <Input id="pc-desc" size="sm" value={f.description} onChange={(e) => set("description")(e.target.value)} maxLength={120} />
        </Field>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">{t("Discount type")}</legend>
          <div role="radiogroup" className="inline-flex h-[38px] gap-0.5 self-start rounded-[10px] bg-muted p-[3px]">
            {(["percent", "fixed"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={f.kind === k}
                onClick={() => set("kind")(k)}
                className={cn("flex h-8 items-center rounded-sm px-3 text-[13px] font-semibold", f.kind === k ? "bg-card text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground")}
              >
                {t(`kind.${k}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pc-value" label={f.kind === "percent" ? t("Percent off") : t("Amount off")} error={err("value", f.kind === "percent" ? t("Percent range") : undefined)}>
            <Affixed id="pc-value" value={f.value} onChange={set("value")} prefix={f.kind === "fixed" ? "$" : undefined} suffix={f.kind === "percent" ? "%" : undefined} invalid={bad.includes("value")} />
          </Field>
          {f.kind === "percent" && (
            <Field id="pc-max" label={t("Max discount")} hint={t("Optional")} error={err("maxDiscount")}>
              <Affixed id="pc-max" value={f.maxDiscount} onChange={set("maxDiscount")} prefix="$" invalid={bad.includes("maxDiscount")} placeholder={t("No cap")} />
            </Field>
          )}
        </div>

        <Field id="pc-min" label={t("Min order")} hint={t("Min order help")} error={err("minOrder")}>
          <Affixed id="pc-min" value={f.minOrder} onChange={set("minOrder")} prefix="$" invalid={bad.includes("minOrder")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pc-start" label={t("Starts")} hint={t("Optional")} error={err("startsAt")}>
            <Input id="pc-start" size="sm" type="date" value={f.startsAt} onChange={(e) => set("startsAt")(e.target.value)} aria-invalid={bad.includes("startsAt")} />
          </Field>
          <Field id="pc-end" label={t("Ends")} hint={t("Optional")} error={err("endsAt", t("End before start"))}>
            <Input id="pc-end" size="sm" type="date" value={f.endsAt} min={f.startsAt || undefined} onChange={(e) => set("endsAt")(e.target.value)} aria-invalid={bad.includes("endsAt")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pc-limit" label={t("Total uses")} hint={t("Total uses help")} error={err("usageLimit")}>
            <Affixed id="pc-limit" value={f.usageLimit} onChange={set("usageLimit")} invalid={bad.includes("usageLimit")} placeholder={t("Unlimited")} />
          </Field>
          <Field id="pc-per" label={t("Per customer")} hint={t("Per customer help")} error={err("perUserLimit")}>
            <Affixed id="pc-per" value={f.perUserLimit} onChange={set("perUserLimit")} invalid={bad.includes("perUserLimit")} />
          </Field>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3.5 py-3">
          <span className="flex flex-col">
            <span className="text-sm font-bold">{t("Active")}</span>
            <span className="text-[13px] text-foreground-secondary">{t("Active help")}</span>
          </span>
          <Switch checked={f.isActive} onCheckedChange={set("isActive")} />
        </label>
      </form>
      <SheetFooter>
        <Button variant="ghost" onClick={onDone}>{t("Cancel")}</Button>
        <Button type="submit" form="promo-form" loading={pending}>{promo ? t("Save changes") : t("Create code")}</Button>
      </SheetFooter>
    </>
  );
}

export function NewPromoButton() {
  const t = useTranslations("AdminPromo");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="md" onClick={() => setOpen(true)}>
      <Plus aria-hidden />
      {t("New code")}
      </Button>
      <PromoCodeSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PromoRowActions({ promo }: { promo: PromoRow }) {
  const t = useTranslations("AdminPromo");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger aria-label={t("More actions", { code: promo.code })} className="flex size-8 items-center justify-center rounded-sm hover:bg-sunken">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setEditing(true)}>{t("Edit")}</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            start(async () => {
              const r = await setPromoActive(promo._id, !promo.isActive);
              if (r.ok) toast.success(promo.isActive ? t("Deactivated") : t("Activated"));
              router.refresh();
            })
          }
        >
          {promo.isActive ? t("Deactivate") : t("Activate")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(promo.code).then(() => toast.success(t("Copied")))}>
          {t("Copy code")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onSelect={() => { setError(null); setDeleting(true); }}>
          {t("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>

      <PromoCodeSheet promo={promo} open={editing} onOpenChange={setEditing} />

      <Dialog open={deleting} onOpenChange={setDeleting}>
      <DialogContent role="alertdialog" closeLabel={t("Close")}>
        <span className="flex size-11 items-center justify-center rounded-full bg-error-bg text-error-fg">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <DialogHeader>
          <DialogTitle>{t("Delete title", { code: promo.code })}</DialogTitle>
          <DialogDescription>{promo.usedCount > 0 ? t("Delete used body") : t("Delete body")}</DialogDescription>
        </DialogHeader>
        {error && <Alert variant="error">{error}</Alert>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeleting(false)}>{t("Cancel")}</Button>
          {promo.usedCount > 0 ? (
            promo.isActive && (
              <Button
                loading={pending}
                onClick={() =>
                  start(async () => {
                    await setPromoActive(promo._id, false);
                    toast.success(t("Deactivated"));
                    setDeleting(false);
                    router.refresh();
                  })
                }
              >
                {t("Deactivate")}
              </Button>
            )
          ) : (
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await deletePromoCode(promo._id);
                  if (r.ok) {
                    toast.success(t("Deleted"));
                    setDeleting(false);
                    router.refresh();
                  } else setError(r.error === "used" ? t("Delete used body") : t("Missing"));
                })
              }
            >
              {t("Delete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
