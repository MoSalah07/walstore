import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Small labels on products and in tables. Orange is only for money off.
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[5px] text-xs font-bold leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-primary-hover dark:text-foreground-secondary",
        ink: "bg-primary text-primary-foreground",
        deal: "bg-deal text-deal-foreground",
        "deal-subtle": "bg-deal-subtle text-deal",
        success: "bg-success-bg text-success-fg",
        warning: "bg-warning-bg text-warning-fg",
        error: "bg-error-bg text-error-fg",
        info: "bg-info-bg text-info-fg",
        violet: "bg-violet-bg text-violet-fg",
        muted: "bg-sunken text-foreground-secondary",
      },
      size: {
        default: "",
        sm: "px-2 py-[3px] text-[11px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// Status is never color alone: every pill has a dot and a word.
export type StatusKey =
  | "unpaid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "pending"
  | "draft"
  | "published"
  | "active"
  | "inactive";

const statusVariant: Record<StatusKey, BadgeProps["variant"]> = {
  unpaid: "warning",
  processing: "info",
  shipped: "violet",
  delivered: "success",
  cancelled: "error",
  pending: "warning",
  draft: "muted",
  published: "success",
  active: "success",
  inactive: "muted",
};

function StatusPill({
  status,
  children,
  className,
  size,
}: {
  status: StatusKey;
  children: React.ReactNode;
  className?: string;
  size?: BadgeProps["size"];
}) {
  return (
    <Badge variant={statusVariant[status]} size={size} dot className={cn("py-1", className)}>
      {children}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusPill };
