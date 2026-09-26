"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { removeMyAddress, saveMyAddress, setDefaultAddress } from "@/actions/account.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShippingAddressSchema } from "@/interfaces/validator/validator";
import type { IUserAddress } from "@/models/user.model";
import { cn } from "@/lib/utils";

type Address = z.infer<typeof ShippingAddressSchema>;
type Saved = IUserAddress & { _id: string };
const COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "JO", "US", "GB", "DE"];
const empty: Address = { fullName: "", phone: "", street: "", city: "", province: "", postalCode: "", country: "EG" };

export default function AddressBook({ addresses }: { addresses: Saved[] }) {
  const t = useTranslations("Account");
  const tc = useTranslations("Checkout");
  const locale = useLocale();
  const region = useMemo(() => new Intl.DisplayNames([locale], { type: "region" }), [locale]);
  const [editing, setEditing] = useState<Saved | "new" | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const [pending, start] = useTransition();
  const form = useForm<Address>({ resolver: zodResolver(ShippingAddressSchema), defaultValues: empty });

  const open = (a: Saved | "new") => {
    setEditing(a);
    setMakeDefault(a !== "new" && !!a.isDefault);
    form.reset(a === "new" ? empty : { fullName: a.fullName, phone: a.phone, street: a.street, city: a.city, province: a.province, postalCode: a.postalCode, country: a.country });
  };

  const submit = (data: Address) =>
    start(async () => {
      const res = await saveMyAddress({ ...data, _id: editing !== "new" ? editing?._id : undefined, isDefault: makeDefault });
      if (res.ok) {
        toast.success(t("Address saved"));
        setEditing(null);
      } else toast.error(t("Something went wrong"));
    });

  const field = (name: keyof Address, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input size="sm" {...props} {...f} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <section id="addresses" className="flex scroll-mt-44 flex-col gap-3.5 rounded-xl border border-border bg-card p-5 md:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{t("Addresses")}</h2>
        <button type="button" onClick={() => open("new")} className="flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline">
          <Plus className="size-4" aria-hidden />
          {t("Add address")}
        </button>
      </div>
      {addresses.length === 0 ? (
        <p className="flex items-center gap-2.5 rounded-[14px] bg-background-subtle p-4 text-sm text-foreground-secondary">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {t("No addresses")}
        </p>
      ) : (
        addresses.map((a) => (
          <div
            key={a._id}
            className={cn(
              "flex justify-between gap-3 rounded-[14px] p-4 text-sm leading-relaxed",
              a.isDefault ? "border-2 border-primary bg-background-subtle" : "border border-border"
            )}
          >
            <span>
              <strong>{a.fullName}</strong>{" "}
              {a.isDefault && (
                <Badge variant="ink" size="sm" className="ms-1.5">
                  {t("Default")}
                </Badge>
              )}
              <br />
              {a.street}
              <br />
              {a.city}, {a.province} {a.postalCode}, {region.of(a.country) ?? a.country}
              <br />
              <span dir="ltr">{a.phone}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              <button type="button" onClick={() => open(a)} className="text-[13px] font-bold hover:underline">
                {t("Edit")}
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => void (await setDefaultAddress(a._id)))}
                  className="text-[13px] font-bold hover:underline"
                >
                  {t("Make default")}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await removeMyAddress(a._id);
                    if (r.ok) toast.success(t("Address removed"));
                  })
                }
                className="text-[13px] font-bold text-destructive hover:underline"
              >
                {t("Remove")}
              </button>
            </span>
          </div>
        ))
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg" closeLabel={t("Close")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>{editing === "new" ? t("Add address") : t("Edit address")}</DialogTitle>
                <DialogDescription>{t("Address help")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("fullName", tc("Full name"), { autoComplete: "name" })}
                {field("phone", tc("Phone number"), { type: "tel", autoComplete: "tel" })}
              </div>
              {field("street", tc("Street address"), { autoComplete: "street-address" })}
              <div className="grid grid-cols-2 gap-3">
                {field("city", tc("City"))}
                {field("province", tc("Province"))}
                {field("postalCode", tc("Postal code"))}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{tc("Country")}</FormLabel>
                      <FormControl>
                        <select {...f} className="h-[42px] w-full rounded-[10px] border-[1.5px] border-input bg-card px-3 text-sm outline-none focus-visible:border-foreground">
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {region.of(c)}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(v === true)} />
                {t("Use as default")}
              </label>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  {t("Cancel")}
                </Button>
                <Button type="submit" loading={pending}>
                  {t("Save address")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
