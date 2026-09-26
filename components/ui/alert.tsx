import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-md border px-4 py-3 text-sm leading-5",
  {
    variants: {
      variant: {
        info: "border-info-fg/25 bg-info-bg text-info-fg",
        success: "border-success-fg/25 bg-success-bg text-success-fg",
        warning: "border-warning-fg/25 bg-warning-bg text-warning-fg",
        error: "border-error-fg/25 bg-error-bg text-error-fg",
        neutral: "border-input bg-secondary text-primary-hover dark:text-foreground-secondary",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  neutral: Info,
};

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  hideIcon?: boolean;
}

function Alert({
  className,
  variant = "info",
  title,
  action,
  hideIcon,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant ?? "info"];
  const role = variant === "error" || variant === "warning" ? "alert" : "status";
  return (
    <div role={role} className={cn(alertVariants({ variant }), className)} {...props}>
      {!hideIcon && <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />}
      <div className="flex-1">
        {title && <strong className="font-bold">{title} </strong>}
        <span className="text-foreground/80 dark:text-foreground-secondary">{children}</span>
      </div>
      {action && <div className="shrink-0 font-bold">{action}</div>}
    </div>
  );
}

export { Alert };
