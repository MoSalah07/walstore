"use client";

import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ScrollTop() {
  const t = useTranslations("Footer");
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex h-12 w-full items-center justify-center gap-2 bg-inverse-raised font-semibold text-inverse-foreground transition-colors duration-fast hover:bg-inverse-raised/80"
    >
      <ChevronUp className="size-4" aria-hidden />
      {t("Back to top")}
    </button>
  );
}
