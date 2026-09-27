"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

// − qty + stepper, same heights as Button. At 1, the minus becomes a remove button when `onRemove` is set.
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  onRemove,
  size = "default",
  labels = { decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove item" },
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  onRemove?: () => void;
  size?: "default" | "sm";
  labels?: { decrease: string; increase: string; remove: string };
  className?: string;
}) {
  const canRemove = !!onRemove && value <= min;
  const btn =
    "flex h-full items-center justify-center text-foreground transition-colors duration-fast hover:bg-sunken disabled:pointer-events-none disabled:text-muted-foreground";
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-[10px] border border-input bg-card shadow-xs",
        size === "sm" ? "h-8 rounded-sm" : "h-10",
        className
      )}
    >
      <button
        type="button"
        className={cn(btn, size === "sm" ? "w-8" : "w-10")}
        aria-label={canRemove ? labels.remove : labels.decrease}
        disabled={!canRemove && value <= min}
        onClick={() => (canRemove ? onRemove?.() : onChange(Math.max(min, value - 1)))}
      >
        {canRemove ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <output aria-live="polite" className="w-7 text-center text-sm font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={cn(btn, size === "sm" ? "w-8" : "w-10")}
        aria-label={labels.increase}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
