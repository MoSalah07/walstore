import * as React from "react";

import { cn } from "@/lib/utils";

// Icon in a soft circle, a title, one line of help and at most two actions.
export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <span className="mb-1 flex size-16 items-center justify-center rounded-full bg-sunken text-foreground [&_svg]:size-7">
          {icon}
        </span>
      )}
      <h2 className="text-xl font-bold">{title}</h2>
      {description && (
        <p className="max-w-md text-[15px] leading-6 text-foreground-secondary">{description}</p>
      )}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2.5">{actions}</div>}
    </div>
  );
}
