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
  whole = false,
}: {
  amount: number;
  className?: string;
  strike?: boolean;
  /** No cents: "$300" for thresholds and ranges. */
  whole?: boolean;
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

  const value = formatMoney(
    whole ? Math.round((rate as number) * amount) : round2((rate as number) * amount),
    currencyName,
    locale,
    whole
  );
  return strike ? (
    <del dir="ltr" className={cn("tabular-nums", className)}>{value}</del>
  ) : (
    <span dir="ltr" className={cn("tabular-nums", className)}>{value}</span>
  );
}
