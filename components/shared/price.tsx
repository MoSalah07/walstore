"use client";

import { useLocale } from "next-intl";

import { useCurrency } from "@/hooks/useCurrency";
import { formatMoney } from "@/lib/format";
import { cn, round2 } from "@/lib/utils";

// Converts a USD amount into the shopper's currency. Shows a quiet
// placeholder until the exchange rate is known.
export default function Price({
  amount,
  className,
  strike = false,
}: {
  amount: number;
  className?: string;
  strike?: boolean;
}) {
  const locale = useLocale();
  const { rate, currencyName, isReady } = useCurrency({ from: "USD" });

  if (!isReady) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block h-[0.9em] w-[4.5ch] animate-pulse rounded-xs bg-sunken align-middle",
          className
        )}
      />
    );
  }

  const value = formatMoney(round2((rate as number) * amount), currencyName, locale);
  return strike ? (
    <del dir="ltr" className={cn("tabular-nums", className)}>{value}</del>
  ) : (
    <span dir="ltr" className={cn("tabular-nums", className)}>{value}</span>
  );
}
