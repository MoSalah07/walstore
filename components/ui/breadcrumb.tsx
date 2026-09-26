import { Link } from "@/i18n/routing";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

// Slash separators need no mirroring. The last item is the current page.
export function Breadcrumb({
  items,
  label = "Breadcrumb",
  className,
}: {
  items: { label: string; href?: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("text-sm text-foreground-secondary", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className={cn(last && "font-semibold text-foreground", "min-w-0 truncate")}>
                {item.href && !last ? (
                  <Link href={item.href} className="transition-colors duration-fast hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>{item.label}</span>
                )}
              </li>
              {!last && (
                <li aria-hidden className="text-muted-foreground">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
