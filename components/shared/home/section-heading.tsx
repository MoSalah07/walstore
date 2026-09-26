import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  title,
  badge,
  action,
  size = "h2",
  className,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  action?: { label: string; href: string };
  size?: "h2" | "h3";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-3.5">
        <h2 className={size === "h2" ? "type-h2" : "font-display text-2xl font-extrabold tracking-[-0.03em] md:text-[28px]"}>
          {title}
        </h2>
        {badge}
      </div>
      {children}
      {action && (
        <Link
          href={action.href}
          className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground md:text-[15px]"
        >
          {action.label}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-fast group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
