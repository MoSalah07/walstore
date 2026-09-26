"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { cancelMyOrder } from "@/actions/order.action";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";
import { ltr } from "@/lib/format";

// Confirm before cancelling; stock goes back to the shelf.
export default function CancelOrderButton({
  orderId,
  orderNumber,
  ...props
}: { orderId: string; orderNumber: string } & ButtonProps) {
  const t = useTranslations("Orders");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="subtle" {...props}>
          {t("Cancel order")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("Close")}>
        <DialogHeader>
          <DialogTitle>{t("Cancel order title", { number: ltr(orderNumber) })}</DialogTitle>
          <DialogDescription>{t("Cancel order body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("Keep order")}
          </Button>
          <Button
            variant="destructive"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await cancelMyOrder(orderId);
                if (res.ok) {
                  toast.success(t("Order cancelled"));
                  setOpen(false);
                  router.refresh();
                } else toast.error(t("Cannot cancel"));
              })
            }
          >
            {t("Cancel order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
