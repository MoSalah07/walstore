"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDirection } from "@/i18n/i18n-confige";
import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import SwitcherMode from "./SwitcherMode";
import MainSwitcher from "./main-switcher";
import ShoppingCart from "./shopping-cart";

export default function MenuDesktop() {
  const locale = useLocale();
  const dir = getDirection(locale);
  const t = useTranslations("Header");

  return (
    <Sheet>
      <SheetTrigger asChild className="md:hidden">
        <Button variant={"secondary"} size={"icon"}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={dir === "ltr" ? "right" : "left"}
        dir={dir === "ltr" ? "ltr" : "rtl"}
        className="bg-slate-500 dark:bg-black"
      >
        <SheetHeader>
          <SheetTitle className="text-white">{t("Menu")}</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        {/* Menus */}
        <div className="flex flex-col justify-center gap-y-4">
          <SwitcherMode />
          <MainSwitcher />
          <ShoppingCart />
        </div>
      </SheetContent>
    </Sheet>
  );
}
