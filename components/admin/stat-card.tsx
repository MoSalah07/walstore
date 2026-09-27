import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { cardVariants } from "@/components/ui/card";

// KPI tile: label, big value, delta vs previous period. Delta is never
// color-only: it carries an arrow and the words.
export default function StatCard({
  label,
  value,
  delta,
  note,
  tone,
  source,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  note?: string;
  tone?: "up" | "down" | "flat";
  source?: string;
}) {
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
  return (
    <div className={cardVariants({ className: "flex flex-col gap-2" })}>
      <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground-secondary">
        {label}
        {source && <span className="rounded-[5px] bg-sunken px-1.5 py-px text-[11px] font-semibold text-muted-foreground">{source}</span>}
      </span>
      <span className="font-display text-[26px] font-extrabold tracking-[-0.02em] tabular-nums md:text-[30px]">{value}</span>
      {delta !== undefined && (
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-secondary">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 font-bold",
              tone === "up" ? "bg-success-bg text-success-fg" : tone === "down" ? "bg-error-bg text-error-fg" : "bg-sunken text-primary-hover dark:text-foreground-secondary"
            )}
          >
            <Icon className="size-3" aria-hidden />
            {delta}
          </span>
          {note}
        </span>
      )}
    </div>
  );
}
