import { Check, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { OrderDTO } from "@/actions/order.action";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// Ordered → Shipped → Delivered with timestamps; a cancelled order ends early.
export default async function OrderProgress({ order, compact = false }: { order: OrderDTO; compact?: boolean }) {
  const [t, locale] = await Promise.all([getTranslations("Orders"), getLocale()]);
  const cancelled = order.status === "cancelled";
  const steps = [
    { label: t("Ordered"), at: order.createdAt, done: true },
    ...(cancelled
      ? [{ label: t("status.cancelled"), at: order.cancelledAt, done: true, cancel: true }]
      : [
          { label: t("status.shipped"), at: order.shippedAt, done: !!order.shippedAt || order.status === "delivered" },
          { label: t("status.delivered"), at: order.deliveredAt, done: order.status === "delivered" },
        ]),
  ];

  return (
    <ol aria-label={t("Order progress")} className={cn("grid", cancelled ? "grid-cols-2" : "grid-cols-3")}>
      {steps.map((s, i) => {
        const next = steps[i + 1];
        return (
          <li key={s.label} className="flex flex-col gap-2.5">
            <span className="flex items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  "cancel" in s && s.cancel
                    ? "bg-destructive text-white"
                    : s.done
                      ? "bg-success text-white"
                      : "border-2 border-input bg-card"
                )}
              >
                {"cancel" in s && s.cancel ? (
                  <X className="size-3.5" strokeWidth={3} aria-hidden />
                ) : (
                  s.done && <Check className="size-3.5" strokeWidth={3} aria-hidden />
                )}
              </span>
              {next && <span className={cn("h-[3px] flex-1", next.done ? "bg-success" : "bg-border")} />}
            </span>
            <span className="flex flex-col gap-0.5 pe-2">
              <span className={cn("text-sm md:text-[15px]", s.done ? "font-bold" : "text-foreground-secondary")}>{s.label}</span>
              {!compact && s.at && (
                <span className="text-xs text-foreground-secondary tabular-nums md:text-[13px]">{formatDateTime(s.at, locale)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
