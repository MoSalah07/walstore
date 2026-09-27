"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Phones: bottom sheet. Tablets: drawer from the end edge. Chips navigate
// immediately; the count on the button follows the results.
export default function FilterSheet({
  children,
  total,
  activeCount,
  clearHref,
}: {
  children: React.ReactNode;
  total: number;
  activeCount: number;
  clearHref: string;
}) {
  const t = useTranslations("Search");
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"bottom" | "end">("bottom");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={() => setSide(window.matchMedia("(min-width: 768px)").matches ? "end" : "bottom")}
          className={buttonVariants({ variant: "outline", size: "md", className: "lg:hidden" })}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("Filters")}
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side={side}
        closeLabel={t("Close filters")}
        className={cn("gap-0 p-0", side === "bottom" ? "max-h-[85dvh] rounded-t-2xl pt-2.5" : "w-[380px] max-w-[90vw]")}
      >
        <SheetHeader className="h-14 justify-center px-4">
          <SheetTitle>{t("Filters")}</SheetTitle>
          <SheetDescription className="sr-only">{t("Filters help")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="flex gap-2.5 border-t border-border-soft px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5">
          <Link
            href={clearHref}
            replace
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("Clear")}
          </Link>
          <Button size="lg" className="flex-1" onClick={() => setOpen(false)}>
            {t("Show results", { count: total })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
