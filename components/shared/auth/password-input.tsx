"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const t = useTranslations("Auth");
    const [show, setShow] = React.useState(false);
    return (
      <div className="relative flex">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("h-[52px] pe-[52px] text-base", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t("Hide password") : t("Show password")}
          aria-pressed={show}
          className="absolute end-1 top-1 flex size-11 items-center justify-center rounded-md text-foreground-secondary hover:text-foreground"
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// 0–4 from length, letters+numbers, mixed case, symbols.
export function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

export function StrengthMeter({ value }: { value: string }) {
  const t = useTranslations("Auth");
  const score = value ? passwordScore(value) : 0;
  const labels = [t("Too short"), t("Weak"), t("Fair"), t("Good"), t("Strong")];
  const color = score <= 1 ? "bg-destructive" : score === 2 ? "bg-[#B45309]" : "bg-success";
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i < score ? color : "bg-muted")} />
        ))}
      </div>
      {value && <span className="w-16 text-end text-xs font-semibold text-foreground-secondary">{labels[score]}</span>}
    </div>
  );
}
