"use client";

import { useState, useTransition } from "react";
import { Banknote, Printer, Truck, PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { addOrderNote, markOrderPaid, setOrderStatus } from "@/actions/admin-order.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/routing";
import type { OrderStatus } from "@/models/order.model";

export function OrderActions({ id, status, isPaid }: { id: string; status: OrderStatus; isPaid: boolean }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(msg);
      else toast.error(t("Order update failed"));
      setConfirm(false);
      router.refresh();
    });

  const next = status === "processing" ? "shipped" : status === "shipped" ? "delivered" : status === "unpaid" ? "processing" : null;
  const cancellable = ["unpaid", "processing", "shipped"].includes(status);

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="md" onClick={() => window.print()}>
        <Printer aria-hidden />
        {t("Print packing slip")}
      </Button>
      {!isPaid && status !== "cancelled" && (
        <Button variant="outline" size="md" loading={pending} onClick={() => run(() => markOrderPaid(id), t("Marked paid"))}>
          <Banknote aria-hidden />
          {t("Mark as paid")}
        </Button>
      )}
      {cancellable && (
        <Dialog open={confirm} onOpenChange={setConfirm}>
          <DialogTrigger asChild>
            <Button variant="destructive-outline" size="md">
              {t("Cancel order")}
            </Button>
          </DialogTrigger>
          <DialogContent closeLabel={t("Close")}>
            <DialogHeader>
              <DialogTitle>{t("Cancel order confirm")}</DialogTitle>
              <DialogDescription>{t("Cancel order help")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirm(false)}>{t("Keep order")}</Button>
              <Button variant="destructive" loading={pending} onClick={() => run(() => setOrderStatus(id, "cancelled"), t("Order cancelled"))}>
                {t("Cancel order")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {next && (
        <Button size="md" loading={pending} onClick={() => run(() => setOrderStatus(id, next), t(`moved.${next}`))}>
          {next === "delivered" ? <PackageCheck aria-hidden /> : <Truck aria-hidden />}
          {t(`next.${next}`)}
        </Button>
      )}
    </div>
  );
}

export function NoteForm({ id }: { id: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-1.5 print:hidden"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addOrderNote(id, note);
          if (r.ok) {
            setNote("");
            router.refresh();
          }
        });
      }}
    >
      <Label htmlFor="note">{t("Internal note")}</Label>
      <div className="flex gap-2">
        <Input id="note" size="sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("Note placeholder")} maxLength={500} />
        <Button type="submit" variant="outline" size="md" className="shrink-0" loading={pending} disabled={!note.trim()}>
          {t("Add note")}
        </Button>
      </div>
    </form>
  );
}
