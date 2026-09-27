"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// "We couldn't load this page" — used by every error.tsx boundary.
export default function ErrorView({
  error,
  reset,
  home = "/",
  className,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  home?: string;
  className?: string;
}) {
  const t = useTranslations("Errors");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={cn("flex flex-1 items-center justify-center px-4 py-16", className)}>
      <div role="alert" className={cardVariants({ flush: true, className: "flex max-w-md flex-col items-center gap-3 px-8 py-10 text-center" })}>
        <span className="mb-1 flex size-16 items-center justify-center rounded-full bg-error-bg text-error-fg">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">{t("Title")}</h1>
        <p className="text-[15px] leading-relaxed text-foreground-secondary">{t("Body")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button onClick={reset}>
            <RefreshCw aria-hidden />
            {t("Try again")}
          </Button>
          <Link href={home} className={buttonVariants({ variant: "outline" })}>
            {t("Go home")}
          </Link>
        </div>
        {error.digest && (
          <span className="mt-1 text-xs text-muted-foreground">
            {t("Reference")}: <code dir="ltr">{error.digest}</code>
          </span>
        )}
      </div>
    </div>
  );
}
