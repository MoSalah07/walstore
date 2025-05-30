"use client";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export default function ScrollTop() {
  const t = useTranslations("Footer");
  return (
    <Button
      variant={"ghost"}
      className="rounded-none w-full bg-blue-950 hover:bg-blue-800 hover:text-white text-white "
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
    >
      {" "}
      <ChevronUp className="mr-2 h-4 w-4" />
      {t("Back to top")}
    </Button>
  );
}
