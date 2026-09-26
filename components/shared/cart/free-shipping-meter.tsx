"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import Price from "@/components/shared/price";

// "Add $X for FREE shipping" + progress bar, or the qualified message.
export default function FreeShippingMeter({
  remaining,
  progress,
}: {
  remaining: number;
  progress: number;
}) {
  const t = useTranslations("Cart");
  return (
    <div className="flex flex-col gap-2.5">
      {remaining <= 0 ? (
        <span className="flex items-center gap-2 text-[15px] font-bold text-success-fg">
          <CheckCircle2 className="size-[18px] shrink-0" aria-hidden />
          {t("Your order qualifies for FREE Shipping")}
        </span>
      ) : (
        <span className="text-[15px]">
          {t.rich("Add for free shipping", {
            price: () => <Price amount={remaining} className="font-bold text-success-fg" />,
          })}
        </span>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={t("Free shipping progress")}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-success transition-[width] duration-slow ease-standard"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
